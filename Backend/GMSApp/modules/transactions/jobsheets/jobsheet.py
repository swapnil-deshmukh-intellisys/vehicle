import base64
import json
import logging
import os
import uuid

from django.contrib import messages
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db import connection, transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from GMSApp.models import (
    BookingStatus,
    BookingTimeline,
    Jobcard,
    JobcardMechanic,
    JobcardVehicleAccessory,
    JobcardVehicleDamage,
    JobcardVehicleIssue,
    ProductCatalogues,
    StockOutwards,
    TXNService,
    Vehicle,
)
from GMSApp.modules import audit, managesession, templatespath
from GMSApp.modules.messaging.whatsapp import send_create_jobcard_message
from GMSApp.modules.transactions.jobsheets import jobcard_utils


@managesession.check_session_timeout
def r_txn_job_sheets(request, context):
    if request.method == "GET":
        # Get jobcards
        jobcard_objs = Jobcard.objects.prefetch_related("jobcard_mechanic").filter(
            garage_id=context["garage_id"]
        )

        # Get counts before pagination (for all)
        context["total_jobcard"] = jobcard_objs.count()
        context["open_jobcard"] = jobcard_objs.filter(status="open").count()
        context["closed_jobcard"] = jobcard_objs.filter(status="closed").count()

        # Check for filter parameter in URL
        status_filter = request.GET.get("filter")
        if status_filter in ["open", "closed"]:
            jobcard_objs = jobcard_objs.filter(status=status_filter)

        # Pagination
        paginator = Paginator(jobcard_objs, 100)
        page_number = request.GET.get("page")
        jobcard_objs = paginator.get_page(page_number)

        for jobcard in jobcard_objs:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT * FROM garage.vw_jobcard_payment 
                    WHERE garage_id = %s AND jobcard_id = %s 
                """,
                    [context["garage_id"], jobcard.id],
                )

                columns = [col[0] for col in cursor.description]
                results = [dict(zip(columns, row)) for row in cursor.fetchall()]

                # Add amount, paid, and pending to jobcard object
                if results:  # If there are payment records
                    payment_info = results[
                        0
                    ]  # Get the first (and should be only) payment record
                    jobcard.amount = float(
                        payment_info.get("service_total", 0)
                        + payment_info.get("parts_total", 0)
                    )
                    jobcard.paid = float(payment_info.get("payment_total", 0))
                    jobcard.pending = float(jobcard.amount - jobcard.paid)
                else:
                    # Default values if no payment record exists
                    jobcard.amount = 0.0
                    jobcard.paid = 0.0
                    jobcard.pending = 0.0

        context["jobcard_objs"] = jobcard_objs

        # calling functions
        audit.create_audit_log(
            context["useremail"],
            f"USER: {context['useremail']}, {request.method}: {request.path}",
            "r_txn_job_sheets",
            200,
        )
        return render(request, templatespath.template_r_txn_job_sheets, context)


@managesession.check_session_timeout
def c_txn_job_sheets(request, context, vehicletype):
    if request.method == "GET":
        context["vehicletype"] = vehicletype

        # Pre-fill jobcard number dynamically
        last_jobcard = (
            Jobcard.objects.filter(garage_id=context["garage_id"])
            .order_by("-jobcard_number")
            .first()
        )
        if last_jobcard and last_jobcard.jobcard_number:
            try:
                # If jobcard_number like "JOB-101"
                prefix, number = last_jobcard.jobcard_number.split("-")
                next_number = int(number) + 1
                context["new_jobcard_number"] = f"{prefix}-{next_number}"
            except Exception:
                # fallback: just append +1 to id
                context["new_jobcard_number"] = f"JOB-{last_jobcard.id + 1}"
        else:
            # First ever jobcard
            context["new_jobcard_number"] = "JOB-101"

        # Get only products with available stock
        context["product_catalogues_objs"] = ProductCatalogues.objects.filter(
            garage_id=context["garage_id"], inward_stock__gt=0
        ).order_by("name")

        # Get only services
        context["service_objs"] = TXNService.objects.filter(
            garage_id=context["garage_id"]
        )

        # calling functions
        audit.create_audit_log(
            context["useremail"],
            f"USER: {context['useremail']}, {request.method}: {request.path}",
            "c_txn_job_sheets",
            200,
        )
        return render(request, templatespath.template_c_txn_job_sheets, context)

    if request.method == "POST":
        try:
            with transaction.atomic():
                jobtypeid = request.POST.get("jobtype")
                customerid = request.POST.get("customer")
                vehicleid = request.POST.get("vehicle", None)
                jobcardnumber = request.POST.get("jobcard_number")
                currentdate = request.POST.get("current_date")
                kmreading = request.POST.get("km_reading")
                fuellevel = request.POST.get("fuel_level")
                supervisorid = request.POST.get("supervisor")
                mechanic_id = request.POST.getlist("mechanic")
                vehicleissuedescription = request.POST.get("vehicle_issue_description")
                vehicle_issue_id = request.POST.getlist("vehicle_issue")
                vehicledamagedescription = request.POST.get(
                    "vehicle_damage_description"
                )
                vehicle_damage_id = request.POST.getlist("vehicle_damage")
                vehicleaccessorydescription = request.POST.get(
                    "vehicle_accessory_description"
                )
                vehicle_accessory_id = request.POST.getlist("vehicle_accessory")

                if not jobtypeid:
                    raise ValueError("Job Type is required")
                if not customerid:
                    raise ValueError("Customer is required")
                if not jobcardnumber:
                    raise ValueError("Job Card Number is required")
                if not currentdate:
                    raise ValueError("Current Date is required")

                # Save damage photos
                saved_photo_paths = []
                damage_photos = request.FILES.getlist("damagephotos")
                if damage_photos:
                    static_dir = os.path.join(
                        "static", "custom-assets", "damage_photos", str(uuid.uuid4())
                    )
                    os.makedirs(static_dir, exist_ok=True)
                    for photo in damage_photos:
                        ext = os.path.splitext(photo.name)[1].lower()
                        filename = f"{uuid.uuid4()}{ext}"
                        file_path = os.path.join(static_dir, filename)
                        with open(file_path, "wb+") as destination:
                            for chunk in photo.chunks():
                                destination.write(chunk)
                        saved_photo_paths.append(
                            os.path.join(
                                "custom-assets",
                                "damage_photos",
                                os.path.basename(static_dir),
                                filename,
                            )
                        )

                # Get vehicle details for message
                vehicle = (
                    Vehicle.objects.filter(id=vehicleid).first() if vehicleid else None
                )
                vehicle_name = (
                    f"{vehicle.jobcardbrand.displayname if vehicle and vehicle.jobcardbrand else ''} {vehicle.jobcardmodel.displayname if vehicle and vehicle.jobcardmodel else ''}".strip()
                    or "Vehicle"
                )
                vehicle_number = vehicle.license_plate_no if vehicle else "N/A"

                # Send WhatsApp message before creating jobcard
                send_create_jobcard_message(vehicle_name, jobcardnumber, vehicle_number)

                jobcard, created = Jobcard.objects.update_or_create(
                    jobcard_number=jobcardnumber,
                    garage_id=context["garage_id"],
                    defaults={
                        "booking_id": None,
                        "jobtype_id": jobtypeid,
                        "customer_id": customerid,
                        "vehicle_id": vehicleid,
                        "current_date": currentdate,
                        "km_reading": kmreading,
                        "fuel_level": fuellevel,
                        "supervisor_id": supervisorid,
                        "vehicle_issue_description": vehicleissuedescription,
                        "vehicle_damage_description": vehicledamagedescription,
                        "vehicle_accessory_description": vehicleaccessorydescription,
                        "damagephotos": saved_photo_paths,
                        "created_by_id": context["userid"],
                    },
                )

                # Assign mechanics
                for mechanic_id in mechanic_id:
                    JobcardMechanic.objects.create(
                        jobcard=jobcard, mechanic_id=mechanic_id
                    )

                # Assign vehicle issues
                for vehicle_issue_id in vehicle_issue_id:
                    JobcardVehicleIssue.objects.create(
                        jobcard=jobcard, vehicleissue_id=vehicle_issue_id
                    )

                # Assign vehicle damage
                for vehicle_damage_id in vehicle_damage_id:
                    JobcardVehicleDamage.objects.create(
                        jobcard=jobcard, vehicledamage_id=vehicle_damage_id
                    )

                # Assign vehicle accessories
                for vehicle_accessory_id in vehicle_accessory_id:
                    JobcardVehicleAccessory.objects.create(
                        jobcard=jobcard, vehicleaccessory_id=vehicle_accessory_id
                    )

                messages.success(request, "Job card created successfully!")
                return redirect("r-txn-job-sheets")

        except (ValidationError, Exception) as e:
            error_msg = (
                ", ".join(e.messages) if isinstance(e, ValidationError) else str(e)
            )
            audit.create_audit_log(
                context["useremail"],
                f"USER: {context['useremail']}, {request.method}: {request.path}",
                error_msg,
                400,
            )
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


@managesession.check_session_timeout
def v_txn_job_sheets(request, context, id):
    # Get the jobcard with direct foreign key relationships
    jobcard_obj = get_object_or_404(
        Jobcard.objects.select_related(
            "jobtype",
            "garage",
            "booking",
            "customer",
            "vehicle",
            "supervisor",
            "created_by",
        ).prefetch_related(
            "jobcard_parts",
            "jobcard_services",
            "jobcard_customer_voice",
            "jobcard_mechanic",
            "jobcard_vehicle_issue",
            "jobcard_vehicle_damage",
            "jobcard_vehicle_accessory",
            "jobcard_payments",
        ),
        id=id,
        garage_id=context["garage_id"],
    )

    if request.method == "GET":
        context.update({"jobcard_obj": jobcard_obj})
        # calling functions
        audit.create_audit_log(
            context["useremail"],
            f"USER: {context['useremail']}, {request.method}: {request.path}",
            "v_txn_job_sheets",
            200,
        )
        return render(request, templatespath.template_v_txn_job_sheets, context)


# without loging
def v_txn_job_sheets_invoice(request, id):
    # reply_to_whatsapp_message()
    # Get the jobcard with direct foreign key relationships
    jobcard_obj = get_object_or_404(
        Jobcard.objects.select_related(
            "jobtype",
            "garage",
            "booking",
            "customer",
            "vehicle",
            "supervisor",
            "created_by",
        ).prefetch_related(
            "jobcard_parts",
            "jobcard_services",
            "jobcard_customer_voice",
            "jobcard_mechanic",
            "jobcard_vehicle_issue",
            "jobcard_vehicle_damage",
            "jobcard_vehicle_accessory",
            "jobcard_payments",
        ),
        random_uuid=id,
    )

    if not jobcard_obj:
        context = {"message": "Job card is closed or not found"}
        return render(
            request, templatespath.template_v_txn_job_sheets_invoice_error, context
        )
    else:
        # Calculate invoice summary values
        subtotal = 0
        taxable_amount = 0
        tax_amount = 0
        discount_amount = 0
        received_amount = 0

        # Calculate Received Amount
        for payment in jobcard_obj.jobcard_payments.all():
            received_amount += payment.amount

        # Calculate service amounts
        for service in jobcard_obj.jobcard_services.all():
            service_quantity = service.quantity
            service_value = service.service_value
            service_value = service_value * service_quantity
            service_tax = service.service_tax
            service_discount = service.service_discount
            # Calculate individual values
            service_discount_value = service_value * (service_discount / 100)
            service_taxable_value = service_value - service_discount_value
            service_tax_value = service_taxable_value * (service_tax / 100)
            # Add to totals
            subtotal += service_value
            discount_amount += service_discount_value
            taxable_amount += service_taxable_value
            tax_amount += service_tax_value

        # Calculate part amounts
        for part in jobcard_obj.jobcard_parts.all():
            part_quantity = part.quantity
            part_value = part.part_value
            part_value = part_value * part_quantity
            part_tax = part.part_tax
            part_discount = part.part_discount
            # Calculate individual values
            part_discount_value = part_value * (part_discount / 100)
            part_taxable_value = part_value - part_discount_value
            part_tax_value = part_taxable_value * (part_tax / 100)
            # Add to totals
            subtotal += part_value
            discount_amount += part_discount_value
            taxable_amount += part_taxable_value
            tax_amount += part_tax_value

        # Add calculated values to the jobcard object
        jobcard_obj.subtotal = subtotal
        jobcard_obj.discount_amount = discount_amount
        jobcard_obj.taxable_amount = taxable_amount
        jobcard_obj.tax_amount = tax_amount
        jobcard_obj.total_amount = taxable_amount + tax_amount
        jobcard_obj.received_amount = received_amount

        # Add the jobcard object to the context
        context = {"jobcard_obj": jobcard_obj}

        return render(request, templatespath.template_v_txn_job_sheets_invoice, context)


def v_txn_job_sheets_customer(request, id):
    # Get the jobcard with direct foreign key relationships
    jobcard_obj = get_object_or_404(
        Jobcard.objects.select_related(
            "jobtype",
            "garage",
            "booking",
            "customer",
            "vehicle",
            "supervisor",
            "created_by",
        ).prefetch_related(
            "jobcard_parts",
            "jobcard_services",
            "jobcard_customer_voice",
            "jobcard_mechanic",
            "jobcard_vehicle_issue",
            "jobcard_vehicle_damage",
            "jobcard_vehicle_accessory",
            "jobcard_payments",
        ),
        random_uuid=id,
    )

    if not jobcard_obj or jobcard_obj.status == "closed":
        context = {"message": "Job card is closed or not found"}
        return render(
            request, templatespath.template_v_txn_job_sheets_invoice_error, context
        )
    else:
        context = {"jobcard_obj": jobcard_obj}
        return render(
            request, templatespath.template_v_txn_job_sheets_invoice_customer, context
        )


def v_txn_job_sheets_mechanic(request, id):
    # Get the jobcard with direct foreign key relationships
    jobcard_obj = get_object_or_404(
        Jobcard.objects.select_related(
            "jobtype",
            "garage",
            "booking",
            "customer",
            "vehicle",
            "supervisor",
            "created_by",
        ).prefetch_related(
            "jobcard_parts",
            "jobcard_services",
            "jobcard_customer_voice",
            "jobcard_mechanic",
            "jobcard_vehicle_issue",
            "jobcard_vehicle_damage",
            "jobcard_vehicle_accessory",
            "jobcard_payments",
        ),
        random_uuid=id,
    )

    if not jobcard_obj or jobcard_obj.status == "closed":
        context = {"message": "Job card is closed or not found"}
        return render(
            request, templatespath.template_v_txn_job_sheets_invoice_error, context
        )
    else:
        context = {"jobcard_obj": jobcard_obj}
        return render(
            request, templatespath.template_v_txn_job_sheets_invoice_mechanic, context
        )


@managesession.check_session_timeout
def u_txn_job_sheets(request, context, id):
    # Get the jobcard with all related data
    jobcard_obj = get_object_or_404(Jobcard, id=id)

    if request.method == "GET":
        context["jobcard_obj"] = jobcard_obj

        # Get only products with available stock
        context["product_catalogues_objs"] = ProductCatalogues.objects.filter(
            garage_id=context["garage_id"], inward_stock__gt=0
        ).order_by("name")

        # Get only services
        context["service_objs"] = TXNService.objects.filter(
            garage_id=context["garage_id"]
        )

        # calling functions
        audit.create_audit_log(
            context["useremail"],
            f"USER: {context['useremail']}, {request.method}: {request.path}",
            "u_txn_job_sheets",
            200,
        )
        return render(request, templatespath.template_u_txn_job_sheets, context)

    if request.method == "POST":
        try:
            with transaction.atomic():
                jobtypeid = request.POST.get("jobtype")
                customerid = request.POST.get("customer")
                vehicleid = request.POST.get("vehicle", None)
                kmreading = request.POST.get("km_reading")
                fuellevel = request.POST.get("fuel_level")
                supervisorid = request.POST.get("supervisor")
                mechanic_id = request.POST.getlist("mechanic")
                vehicleissuedescription = request.POST.get("vehicle_issue_description")
                vehicle_issue_id = request.POST.getlist("vehicle_issue")
                vehicledamagedescription = request.POST.get(
                    "vehicle_damage_description"
                )
                vehicle_damage_id = request.POST.getlist("vehicle_damage")
                vehicleaccessorydescription = request.POST.get(
                    "vehicle_accessory_description"
                )
                vehicle_accessory_id = request.POST.getlist("vehicle_accessory")
                worknote = request.POST.get("work_note")
                delivery_timeline = request.POST.get("delivery_timeline") or None
                reminderduration = request.POST.get("reminder_duration") or 0
                reminderkm = request.POST.get("reminder_km") or 0

                if not jobtypeid:
                    raise ValueError("Job Type is required")
                if not customerid:
                    raise ValueError("Customer is required")

                # Update damage photos
                damage_photos = request.FILES.getlist("damagephotos")
                removed_photos = json.loads(request.POST.get("removed_photos", "[]"))
                saved_photo_paths = []

                # Get existing photos, excluding any that were removed
                existing_photos = jobcard_obj.damagephotos or []
                if removed_photos:
                    # Remove the static/ prefix if present for comparison
                    removed_photos = [
                        p.replace("static/", "") if p.startswith("static/") else p
                        for p in removed_photos
                    ]
                    existing_photos = [
                        p for p in existing_photos if p not in removed_photos
                    ]

                # Remove photos that were marked for deletion
                for photo_path in removed_photos:
                    try:
                        full_path = os.path.join("static", photo_path)
                        if os.path.exists(full_path):
                            os.remove(full_path)
                            # Remove the directory if it's empty
                            dir_path = os.path.dirname(full_path)
                            if os.path.exists(dir_path) and not os.listdir(dir_path):
                                os.rmdir(dir_path)
                    except Exception as e:
                        print(f"Error removing photo {photo_path}: {str(e)}")

                # Save new damage photos if any were uploaded
                if damage_photos:
                    static_dir = os.path.join(
                        "static", "custom-assets", "damage_photos", str(uuid.uuid4())
                    )
                    os.makedirs(static_dir, exist_ok=True)
                    for photo in damage_photos:
                        try:
                            ext = os.path.splitext(photo.name)[1].lower()
                            filename = f"{uuid.uuid4()}{ext}"
                            file_path = os.path.join(static_dir, filename)
                            with open(file_path, "wb+") as destination:
                                for chunk in photo.chunks():
                                    destination.write(chunk)
                            saved_photo_paths.append(
                                os.path.join(
                                    "custom-assets",
                                    "damage_photos",
                                    os.path.basename(static_dir),
                                    filename,
                                )
                            )
                        except Exception as e:
                            print(f"Error saving new photo {photo.name}: {str(e)}")
                            continue

                # Combine existing (non-removed) and new photos
                all_photos = existing_photos + saved_photo_paths

                # Get vehicle details for message
                vehicle = (
                    Vehicle.objects.filter(id=vehicleid).first()
                    if vehicleid
                    else jobcard_obj.vehicle
                )
                vehicle_name = (
                    f"{vehicle.jobcardbrand.displayname if vehicle and vehicle.jobcardbrand else ''} {vehicle.jobcardmodel.displayname if vehicle and vehicle.jobcardmodel else ''}".strip()
                    or "Vehicle"
                )
                vehicle_number = vehicle.license_plate_no if vehicle else "N/A"

                # Send WhatsApp message before updating jobcard
                send_create_jobcard_message(
                    vehicle_name, jobcard_obj.jobcard_number, vehicle_number
                )

                jobcard_obj.jobtype_id = jobtypeid
                jobcard_obj.customer_id = customerid
                jobcard_obj.vehicle_id = vehicleid
                jobcard_obj.km_reading = kmreading
                jobcard_obj.fuel_level = fuellevel
                jobcard_obj.supervisor_id = supervisorid
                jobcard_obj.vehicle_issue_description = vehicleissuedescription
                jobcard_obj.vehicle_damage_description = vehicledamagedescription
                jobcard_obj.vehicle_accessory_description = vehicleaccessorydescription
                jobcard_obj.damagephotos = all_photos
                jobcard_obj.work_note = worknote
                jobcard_obj.delivery_timeline = delivery_timeline
                jobcard_obj.reminder_duration = reminderduration
                jobcard_obj.reminder_km = reminderkm
                jobcard_obj.save()

                # Assign mechanics
                # Delete existing mechanics
                JobcardMechanic.objects.filter(jobcard=jobcard_obj).delete()
                for mechanic_id in mechanic_id:
                    JobcardMechanic.objects.create(
                        jobcard=jobcard_obj, mechanic_id=mechanic_id
                    )

                # Assign vehicle issues
                # Delete existing vehicle issues
                JobcardVehicleIssue.objects.filter(jobcard=jobcard_obj).delete()
                for vehicle_issue_id in vehicle_issue_id:
                    JobcardVehicleIssue.objects.create(
                        jobcard=jobcard_obj, vehicleissue_id=vehicle_issue_id
                    )

                # Assign vehicle damage
                # Delete existing vehicle damage
                JobcardVehicleDamage.objects.filter(jobcard=jobcard_obj).delete()
                for vehicle_damage_id in vehicle_damage_id:
                    JobcardVehicleDamage.objects.create(
                        jobcard=jobcard_obj, vehicledamage_id=vehicle_damage_id
                    )

                # Assign vehicle accessories
                # Delete existing vehicle accessories
                JobcardVehicleAccessory.objects.filter(jobcard=jobcard_obj).delete()
                for vehicle_accessory_id in vehicle_accessory_id:
                    JobcardVehicleAccessory.objects.create(
                        jobcard=jobcard_obj, vehicleaccessory_id=vehicle_accessory_id
                    )

                messages.success(request, "Job card updated successfully!")
        except (ValidationError, Exception) as e:
            error_msg = (
                ", ".join(e.messages) if isinstance(e, ValidationError) else str(e)
            )
            audit.create_audit_log(
                context["useremail"],
                f"USER: {context['useremail']}, {request.method}: {request.path}",
                error_msg,
                400,
            )
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
        return redirect(request.path)


@managesession.check_session_timeout
def d_txn_job_sheets(request, context):
    if request.method == "POST":
        try:
            with transaction.atomic():
                product_ids = request.POST.getlist("id[]")
                deleted_data = []
                for id in product_ids:
                    jobcard_obj = get_object_or_404(Jobcard, id=id)
                    if jobcard_obj:
                        deleted_data.append(jobcard_obj.id)
                        jobcard_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} jobcard deleted"
                    sts = True
                else:
                    msg = "Failed to delete jobcard"
                    sts = False
                msg = msg.replace("[", "").replace("]", "")

                # calling functions
                audit.create_audit_log(
                    context["useremail"],
                    f"USER: {context['useremail']}, {request.method}: {request.path}",
                    msg,
                    200,
                )
                response = JsonResponse({"status": sts, "message": msg})
        except (ValidationError, Exception) as e:
            # Determine error message based on exception type
            error_msg = (
                ", ".join(e.messages) if isinstance(e, ValidationError) else str(e)
            )
            # calling functions
            audit.create_audit_log(
                context["useremail"],
                f"USER: {context['useremail']}, {request.method}: {request.path}",
                error_msg,
                400,
            )
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            response = JsonResponse({"status": False, "message": error_msg})
        return response


@csrf_exempt
@require_http_methods(["POST"])
def update_jobcard_status(request, jobcard_id):
    try:
        data = json.loads(request.body)
        new_status = data.get("status")

        if not new_status or new_status not in ["open", "closed"]:
            return JsonResponse(
                {"success": False, "message": "Invalid status"}, status=400
            )

        jobcard = get_object_or_404(Jobcard, id=jobcard_id)

        with transaction.atomic():
            if new_status == "closed":
                if jobcard.booking:
                    status_obj = BookingStatus.objects.get(name="work_completed")
                    BookingTimeline.objects.create(
                        booking_id=jobcard.booking.id,
                        status=status_obj,
                        remark=jobcard.jobcard_number,
                    )

                # Handle StockOutwards for jobcard parts
                for jobcard_part in jobcard.jobcard_parts.filter(
                    part_source="internal", part__isnull=False
                ):
                    part = jobcard_part.part
                    quantity = jobcard_part.quantity

                    # Update stock in ProductCatalogues
                    part.outward_stock += quantity
                    part.save()

                    # Create StockOutwards entry
                    StockOutwards.objects.create(
                        garage_id=jobcard.garage_id,
                        product=part,
                        quantity=quantity,
                        rate=float(jobcard_part.part_value),
                        discount=float(jobcard_part.part_discount),
                        gst=float(jobcard_part.part_tax),
                        total_price=float(jobcard_part.part_value) * quantity,
                        issued_to=jobcard.customer.name if jobcard.customer else "",
                        issued_date=jobcard.current_date,
                        usage_purpose="Jobcard",
                        reference_document=str(jobcard.id),
                        location="Jobcard",
                        rack="Jobcard",
                        remarks=f"Jobcard: {jobcard.jobcard_number}",
                    )

            jobcard.status = new_status
            jobcard.save()

        return JsonResponse(
            {
                "success": True,
                "message": "Status updated successfully",
                "new_status": new_status,
                "jobcard_id": jobcard_id,
            }
        )

    except json.JSONDecodeError:
        return JsonResponse({"success": False, "message": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@managesession.check_session_timeout
def job_sheets_vehicletype(request, context):
    if request.method == "GET":
        # calling functions
        audit.create_audit_log(
            context["useremail"],
            f"USER: {context['useremail']}, {request.method}: {request.path}",
            "job_sheets_vehicletype",
            200,
        )
        return render(request, templatespath.template_job_sheets_vehicletype, context)

    if request.method == "POST":
        try:
            with transaction.atomic():
                # Extract form data
                vehicletype = request.POST.get("vehicle_type_radio", "")
                if not vehicletype:
                    raise ValidationError("Vehicle type is required")

                audit.create_audit_log(
                    context["useremail"],
                    f"USER: {context['useremail']}, {request.method}: {request.path}",
                    "job_sheets_vehicletype",
                    200,
                )
                return redirect("c-txn-job-sheets", vehicletype)
        except (ValidationError, Exception) as e:
            error_msg = (
                ", ".join(e.messages) if isinstance(e, ValidationError) else str(e)
            )
            audit.create_audit_log(
                context["useremail"],
                f"USER: {context['useremail']}, {request.method}: {request.path}",
                error_msg,
                400,
            )
            messages.error(request, error_msg)
            logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
            return redirect(request.path)


def get_customer_vehicles(request, customer_id):
    """Return vehicles for a customer with normalized field names expected by frontend.

    Response format:
    {
        "status": "success",
        "vehicles": [
            {
                "id": <int>,
                "model": <str>,
                "make": <str>,
                "registration_no": <str>,
                "license_plate_no": <str>,
                "year_of_manufacture": <str|null>,
                "color": <str|null>,
                "engine_number": <str|null>,
                "chassis_number": <str|null>
            },
            ...
        ]
    }
    """
    try:
        qs = Vehicle.objects.filter(customer_id=customer_id).values(
            "id",
            "model",
            "make",
            "registration_no",
            "license_plate_no",
            "year_of_manufacture",
            "color",
            "engine_no",
            "chassis_no",
        )

        vehicles = []
        for v in qs:
            vehicles.append(
                {
                    "id": v.get("id"),
                    "model": v.get("model") or "",
                    "make": v.get("make") or "",
                    # prefer registration_no but fall back to license_plate_no
                    "registration_no": v.get("registration_no")
                    or v.get("license_plate_no")
                    or "",
                    "license_plate_no": v.get("license_plate_no") or "",
                    "year_of_manufacture": v.get("year_of_manufacture"),
                    "color": v.get("color"),
                    "engine_number": v.get("engine_no"),
                    "chassis_number": v.get("chassis_no"),
                }
            )

        return JsonResponse({"status": "success", "vehicles": vehicles}, safe=False)
    except Exception as e:
        logging.getLogger(__name__).exception(
            "Error fetching vehicles for customer %s", customer_id
        )
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@managesession.check_session_timeout
def list_customer_details(request, context):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT * FROM garage.vw_customer_details 
            WHERE garage_id = %s
            GROUP BY customer_id
            ORDER BY name
        """,
            [context["garage_id"]],
        )

        columns = [col[0] for col in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]

    return JsonResponse(results, safe=False)


@managesession.check_session_timeout
@csrf_exempt
@require_http_methods(["POST"])
def save_jobcard_mark_damage_img(request, context):
    try:
        with transaction.atomic():
            jobcard_number = request.POST.get("jobcard_number")
            if not jobcard_number:
                return JsonResponse(
                    {"status": "error", "message": "Jobcard number is required"},
                    status=400,
                )

            # Get or create jobcard
            jobcard_id = jobcard_utils.get_or_create_jobcard(jobcard_number, context)
            jobcard = Jobcard.objects.select_for_update().get(id=jobcard_id)

            # Check if there's an existing diagram image to delete
            if jobcard.diagram_image:
                try:
                    # Construct full file path
                    diagram_dir = os.path.join(
                        "static", "images", "vehicles", "diagrams"
                    )
                    diagram_path = os.path.join(diagram_dir, jobcard.diagram_image)
                    # Delete the file if it exists
                    if os.path.exists(diagram_path):
                        os.remove(diagram_path)
                except Exception as e:
                    # Log the error but continue with saving new image
                    print(f"Error deleting old diagram image: {str(e)}")

            # Save new diagram image if exists
            diagram_image_data = request.POST.get("diagram_image", "")
            if not diagram_image_data or not diagram_image_data.startswith(
                "data:image/png;base64,"
            ):
                return JsonResponse(
                    {"status": "error", "message": "Invalid diagram image data"},
                    status=400,
                )

            # Create directory for diagram images if it doesn't exist
            diagram_dir = os.path.join("static", "images", "vehicles", "diagrams")
            os.makedirs(diagram_dir, exist_ok=True)

            # Generate unique filename
            filename = f"diagram_{uuid.uuid4()}.png"
            filepath = os.path.join(diagram_dir, filename)

            try:
                # Save base64 image data to file
                img_data = diagram_image_data.split("base64,")[1]
                with open(filepath, "wb") as f:
                    f.write(base64.b64decode(img_data))

                # Update jobcard with just the filename
                jobcard.diagram_image = filename  # Store only filename in database
                jobcard.save()

                # # Return the full relative path in the response
                # relative_path = os.path.join('images', 'vehicles', 'diagrams', filename).replace('\\', '/')

                return JsonResponse(
                    {
                        "status": "success",
                        "diagram_image": filename,
                        "message": "Diagram image saved successfully",
                    }
                )

            except Exception as e:
                # Clean up the file if there was an error saving it
                if os.path.exists(filepath):
                    os.remove(filepath)
                raise e

    except Jobcard.DoesNotExist:
        return JsonResponse(
            {"status": "error", "message": "Jobcard not found"}, status=404
        )
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)


#####################################
# commented pc on 16 sep 2025

# def add_vehicle(request, context):
#     if request.method == "POST":
#         print("this is add vehicle form")
#         customer_id = request.POST.get("customer_id")
#         print("customer_id", customer_id)

#         customer = get_object_or_404(Customer, id=customer_id)

#         vehicle = Vehicle.objects.create(
#             customer=customer,
#             license_plate_no=request.POST.get("vehicle_number"),
#             vehicletype=request.POST.get("vehicletype"),
#             year_of_manufacture=request.POST.get("year_of_manufacture") or None,
#             color=request.POST.get("color") or "",
#             chassis_no=request.POST.get("chassis_no") or "",
#             engine_no=request.POST.get("engine_no") or "",
#             garage_id=context['garage_id'],
#         )

#         return JsonResponse({
#             "status": "success",
#             "vehicle": {
#                 "id": vehicle.id,
#                 "customer_id": vehicle.customer_id,
#                 "license_plate_no": vehicle.license_plate_no,
#                 "vehicletype": vehicle.vehicletype,
#                 "year_of_manufacture": vehicle.year_of_manufacture,
#                 "color": vehicle.color,
#                 "chassis_no": vehicle.chassis_no,
#                 "engine_no": vehicle.engine_no,
#             }
#         })

#     return JsonResponse({"status": "error"}, status=400)


# @managesession.check_session_timeout
# def c_txn_job_sheets(request, context, vehicletype):
#     context['vehicletype'] = vehicletype

#     # Check for booking_id in query parameters
#     qs_booking_id = request.GET.get('booking_id')

#     if request.method == 'GET':
#         # Check whether booking_id was found in GET parameters
#         if qs_booking_id:
#             context['booking_obj'] = get_object_or_404(SubscriberBooking, id=qs_booking_id)

#         # Get vehicle accessories
#         context['vehicle_accessories_objs'] = VehicleAccessories.objects.filter(garage_id=context['garage_id'], vehicletype=vehicletype)

#         # Get vehicle common issues
#         context['vehicle_common_issues_objs'] = VehicleCommonIssues.objects.filter(garage_id=context['garage_id'], vehicletype=vehicletype)

#         # Get service checklist
#         context['service_checklist_objs'] = ServiceChecklist.objects.filter(garage_id=context['garage_id'], vehicletype=vehicletype)

#         # Get brands
#         context['brand_objs'] = JobcardBrands.objects.filter(garage_id=context['garage_id'], vehicletype=vehicletype)

#         # Get models
#         context['model_objs'] = JobcardModels.objects.filter(garage_id=context['garage_id'], vehicletype=vehicletype)

#         # calling functions
#         audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'c_txn_job_sheets', 200)
#         return render(request, templatespath.template_c_txn_job_sheets, context)

#     if request.method == 'POST':
#         try:
#             with transaction.atomic():
#                 # Safely handle numeric fields with proper validation
#                 def safe_float(value, default=0.0):
#                     try:
#                         return float(value) if value and str(value).strip() else default
#                     except (ValueError, TypeError):
#                         return default

#                 # Handle brand (existing or new)
#                 existing_jobcardbrand_id = request.POST.get('existing_jobcardbrand')
#                 if existing_jobcardbrand_id.startswith('new_brand_'):
#                     # Create new brand - use the name as is from the frontend
#                     display_name = existing_jobcardbrand_id.replace('new_brand_', '')
#                     jobcardbrand, created = JobcardBrands.objects.get_or_create(
#                         garage_id=context['garage_id'],
#                         vehicletype=vehicletype,
#                         name=display_name.lower().replace(' ', '').replace('_', ''), # Keep URL-friendly name
#                         defaults={'displayname': display_name} # Keep original display name
#                     )
#                 else:
#                     # Get existing brand
#                     jobcardbrand = get_object_or_404(JobcardBrands, id=existing_jobcardbrand_id)

#                 # Handle model (existing or new)
#                 existing_jobcardmodel_id = request.POST.get('existing_jobcardmodel')
#                 if existing_jobcardmodel_id.startswith('new_model_'):
#                     # Create new model
#                     display_name = existing_jobcardmodel_id.replace('new_model_', '')
#                     jobcardmodel, created = JobcardModels.objects.get_or_create(
#                         garage_id=context['garage_id'],
#                         vehicletype=vehicletype,
#                         jobcardbrand=jobcardbrand,
#                         name=display_name.lower().replace(' ', '').replace('_', ''), # Keep URL-friendly name
#                         defaults={'displayname': display_name} # Keep original display name
#                     )
#                 else:
#                     # Get existing model and verify it belongs to the selected brand
#                     jobcardmodel = get_object_or_404(
#                         JobcardModels,
#                         id=existing_jobcardmodel_id,
#                         jobcardbrand=jobcardbrand
#                     )

#                 # Save damage photos
#                 saved_photo_paths = []
#                 damage_photos = request.FILES.getlist('damagephotos')
#                 if damage_photos:
#                     static_dir = os.path.join('static', 'custom-assets', 'damage_photos', str(uuid.uuid4()))
#                     os.makedirs(static_dir, exist_ok=True)
#                     for photo in damage_photos:
#                         ext = os.path.splitext(photo.name)[1].lower()
#                         filename = f"{uuid.uuid4()}{ext}"
#                         file_path = os.path.join(static_dir, filename)
#                         with open(file_path, 'wb+') as destination:
#                             for chunk in photo.chunks():
#                                 destination.write(chunk)
#                         saved_photo_paths.append(os.path.join('custom-assets', 'damage_photos', os.path.basename(static_dir), filename))

#                 # Save diagram image if exists
#                 diagram_image_path = ''
#                 diagram_image_data = request.POST.get('diagram_image', '')
#                 if diagram_image_data and diagram_image_data.startswith('data:image/png;base64,'):
#                     try:
#                         # Create directory for diagram images if it doesn't exist
#                         diagram_dir = os.path.join('static', 'images', 'vehicles', 'diagrams')
#                         os.makedirs(diagram_dir, exist_ok=True)

#                         # Generate unique filename
#                         filename = f"diagram_{uuid.uuid4()}.png"
#                         filepath = os.path.join(diagram_dir, filename)

#                         # Save base64 image data to file
#                         img_data = diagram_image_data.split('base64,')[1]
#                         import base64
#                         with open(filepath, 'wb') as f:
#                             f.write(base64.b64decode(img_data))

#                         # Save relative path to the image
#                         diagram_image_path = os.path.join('images', 'vehicles', 'diagrams', filename)
#                     except Exception as e:
#                         print(f"Error saving diagram image: {str(e)}")

#                 # Customer Details
#                 customermobile = request.POST.get('customermobile')
#                 customername = request.POST.get('customername')
#                 customercomments = request.POST.get('customercomments')
#                 check_customer = Customer.objects.filter(garage_id=context['garage_id'], phone=customermobile).first()
#                 if check_customer:
#                     check_customer.name = customername
#                     check_customer.comments = customercomments
#                     check_customer.save()
#                     customer = check_customer
#                 else:
#                     customer = Customer.objects.create(
#                         garage_id=context['garage_id'],
#                         phone=customermobile,
#                         name=customername,
#                         comments=customercomments
#                     )

#                 # Vehicle Details
#                 vehiclenumber = request.POST.get('vehiclenumber')
#                 dailyrunning = safe_float(request.POST.get('dailyrunning'))
#                 odometerreading = safe_float(request.POST.get('odometerreading'))
#                 vehiclemileage = safe_float(request.POST.get('vehiclemileage'))
#                 vehicleage = safe_float(request.POST.get('vehicleage'))
#                 vehiclefueltype = request.POST.get('vehiclefueltype', '')
#                 # Handle fuel percentage with validation (0-100)
#                 try:
#                     fuelpercentage = int(request.POST.get('fuelpercentage', 0))
#                     fuelpercentage = max(0, min(100, fuelpercentage))  # Ensure between 0-100
#                 except (ValueError, TypeError):
#                     fuelpercentage = 0

#                 vehicle = None
#                 if 'booking_vehicle_id' in request.POST:
#                     booking_vehicle_id = request.POST.get('booking_vehicle_id')
#                     booking_vehicle = get_object_or_404(Vehicle, id=booking_vehicle_id)
#                     booking_vehicle.license_plate_no = vehiclenumber
#                     booking_vehicle.registration_no = vehiclenumber
#                     booking_vehicle.jobcardbrand = jobcardbrand
#                     booking_vehicle.jobcardmodel = jobcardmodel
#                     # booking_vehicle.year_of_manufacture = get data by proviced vehicleage
#                     booking_vehicle.fuel_type = vehiclefueltype
#                     booking_vehicle.dailyrunning = dailyrunning
#                     booking_vehicle.odometerreading = odometerreading
#                     booking_vehicle.vehiclemileage = vehiclemileage
#                     booking_vehicle.vehicleage = vehicleage
#                     booking_vehicle.fuelpercentage = fuelpercentage
#                     booking_vehicle.save()
#                     vehicle = booking_vehicle

#                 # Dent & Damage Record
#                 damagedescription = request.POST.get('damagedescription')
#                 delivery_date = request.POST.get('deliverydate') or None
#                 delivery_time = request.POST.get('deliverytime') or None

#                 # # Get dent positions from form data
#                 # dent_positions = request.POST.get('dent_positions')
#                 # try:
#                 #     dent_positions = json.loads(dent_positions) if dent_positions else None
#                 # except json.JSONDecodeError:
#                 #     dent_positions = None

#                 # Create Jobcard
#                 jobcard = Jobcard.objects.create(
#                     garage_id=context['garage_id'],
#                     booking_id=qs_booking_id if qs_booking_id else None,
#                     customer = customer,
#                     vehicle = vehicle,
#                     damagedescription=damagedescription,
#                     damagephotos=saved_photo_paths,
#                     diagram_image=diagram_image_path,
#                     delivery_date=delivery_date,
#                     delivery_time=delivery_time,
#                     # dent_positions=dent_positions,
#                 )

#                 def process_items(items, prefix, model_class, jobcard_relation, status_field=None):
#                     """
#                     Generic function to process items (issues, accessories, or checklist items)

#                     Args:
#                         items: List of items to process
#                         prefix: The prefix used to identify new items (e.g., 'new_issue_')
#                         model_class: The model class for the item
#                         jobcard_relation: The related name for the jobcard relationship
#                         status_field: Optional status field name and value as a tuple (field_name, value)
#                     """
#                     new_items = []
#                     existing_ids = []

#                     # Categorize items into new and existing
#                     for item in filter(None, items):
#                         item = str(item)
#                         if item.startswith(prefix):
#                             # Extract and clean the display name
#                             display_name = item.replace(prefix, '').replace('_', ' ').strip()
#                             if display_name:
#                                 new_items.append(display_name)
#                         else:
#                             existing_ids.append(item)

#                     # Process new items
#                     if new_items:
#                         # Create all new items in bulk
#                         model_instances = []
#                         for name in new_items:
#                             display_name = name.replace(prefix, '')
#                             model_kwargs = {
#                                 'garage_id': context['garage_id'],
#                                 'name': display_name.lower().replace(' ', '').replace('_', ''),
#                                 'displayname': display_name
#                             }
#                             # Add vehicletype if the model has this field
#                             if hasattr(model_class, 'vehicletype'):
#                                 model_kwargs['vehicletype'] = vehicletype
#                             model_instances.append(model_class(**model_kwargs))

#                         # Bulk create new items, ignoring duplicates
#                         created_items = model_class.objects.bulk_create(
#                             model_instances,
#                             ignore_conflicts=True
#                         )

#                         # Get all new items (including any that already existed)
#                         name_lower_list = [i.name for i in model_instances]
#                         filter_kwargs = {
#                             'garage_id': context['garage_id'],
#                             'name__in': name_lower_list
#                         }
#                         # Add vehicletype to filter if the model has this field
#                         if hasattr(model_class, 'vehicletype'):
#                             filter_kwargs['vehicletype'] = vehicletype

#                         new_instances = model_class.objects.filter(**filter_kwargs)

#                         # Create jobcard relations for new items
#                         jobcard_relation_objs = [
#                             jobcard_relation['model'](
#                                 jobcard=jobcard,
#                                 **({status_field[0]: status_field[1]} if status_field else {}),
#                                 **{jobcard_relation['field']: item}
#                             )
#                             for item in new_instances
#                         ]
#                         jobcard_relation['model'].objects.bulk_create(
#                             jobcard_relation_objs,
#                             ignore_conflicts=True
#                         )

#                     # Process existing items
#                     if existing_ids:
#                         # Create jobcard relations for existing items
#                         jobcard_relation_objs = [
#                             jobcard_relation['model'](
#                                 jobcard=jobcard,
#                                 **({status_field[0]: status_field[1]} if status_field else {}),
#                                 **{f"{jobcard_relation['field']}_id": item_id}
#                             )
#                             for item_id in existing_ids
#                         ]
#                         jobcard_relation['model'].objects.bulk_create(
#                             jobcard_relation_objs,
#                             ignore_conflicts=True
#                         )

#                 # Process vehicle issues
#                 process_items(
#                     items=request.POST.getlist('vehicleexistingcommonissues', []),
#                     prefix='new_issue_',
#                     model_class=VehicleCommonIssues,
#                     jobcard_relation={
#                         'model': JobcardVehicleCommonIssues,
#                         'field': 'vehiclecommonissues'
#                     },
#                     status_field=('status', 'active')
#                 )

#                 # Process vehicle accessories
#                 process_items(
#                     items=request.POST.getlist('vehicleexistingaccessories', []),
#                     prefix='new_accessory_',
#                     model_class=VehicleAccessories,
#                     jobcard_relation={
#                         'model': JobcardVehicleAccessories,
#                         'field': 'vehicleaccessories'
#                     }
#                 )

#                 # Process service checklist items
#                 process_items(
#                     items=request.POST.getlist('service_checklist', []),
#                     prefix='new_checklist_',
#                     model_class=ServiceChecklist,
#                     jobcard_relation={
#                         'model': JobcardServiceChecklist,
#                         'field': 'servicechecklist'
#                     }
#                 )

#                 # Call external API if booking exists
#                 if qs_booking_id:
#                     try:
#                         data = {'booking_id': qs_booking_id, 'status': 'job_card_created', 'remark': 'Jobcard ID: ' + str(jobcard.id)}
#                         api_url = request.build_absolute_uri(reverse('api-subscriber-booking-update-status'))
#                         response = requests.post(
#                             api_url,
#                             json=data,
#                             headers={
#                                 'Content-Type': 'application/json',
#                                 'X-Requested-With': 'XMLHttpRequest'
#                             }
#                         )
#                         if response.status_code == 200 and response.json().get('status'):
#                             messages.success(request, 'Job card creation and booking status updated successfully!')
#                         else:
#                             messages.warning(request, response.json().get('message'))
#                     except Exception:
#                         messages.error(request, 'Error updating booking status.')
#                     return redirect('v-accounts-bookings', id=qs_booking_id)
#                 else:
#                     messages.success(request, 'Job card created successfully!')
#                     return redirect('r-txn-job-sheets')

#                 audit.create_audit_log(
#                     context['useremail'],
#                     f'USER: {context["useremail"]}, {request.method}: {request.path}',
#                     'c_txn_job_sheets', 200
#                 )
#         except (ValidationError, Exception) as e:
#             error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
#             audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
#             messages.error(request, error_msg)
#             logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
#             if qs_booking_id:
#                 return redirect('v-accounts-bookings', id=qs_booking_id)
#             else:
#                 return redirect(request.path)


# @managesession.check_session_timeout
# def u_txn_job_sheets(request, context, id):
#     jobcard_obj = get_object_or_404(Jobcard, id=id)
#     context.update({
#         'jobcard_obj': jobcard_obj
#     })


#     if request.method == 'GET':
#         # Get vehicle type dynamically from the jobcard's vehicle
#         vehicle_type = jobcard_obj.vehicle.vehicletype if jobcard_obj.vehicle else '2'
#         # Get vehicle accessories
#         context['vehicle_accessories_objs'] = VehicleAccessories.objects.filter(garage_id=context['garage_id'], vehicletype=vehicle_type)
#         context['selected_vehicle_accessories'] = jobcard_obj.jobcard_vehicle_accessories.values_list('vehicleaccessories_id', flat=True)

#         # Get vehicle common issues
#         context['vehicle_common_issues_objs'] = VehicleCommonIssues.objects.filter(garage_id=context['garage_id'], vehicletype=vehicle_type)
#         context['selected_vehicle_common_issues'] = jobcard_obj.jobcard_vehicle_common_issues.values_list('vehiclecommonissues_id', flat=True)

#         # Get service checklist
#         context['service_checklist_objs'] = ServiceChecklist.objects.filter(garage_id=context['garage_id'], vehicletype=vehicle_type)
#         context['selected_service_checklist'] = jobcard_obj.jobcard_service_checklist.values_list('servicechecklist_id', flat=True)

#         # Get brands
#         context['brand_objs'] = JobcardBrands.objects.filter(garage_id=context['garage_id'], vehicletype=vehicle_type)

#         # Get models
#         context['model_objs'] = JobcardModels.objects.filter(garage_id=context['garage_id'], vehicletype=vehicle_type)

#         # calling functions
#         audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_txn_job_sheets', 200)
#         return render(request, templatespath.template_u_txn_job_sheets, context)

#     if request.method == 'POST':
#         try:
#             with transaction.atomic():
#                 updated = False  # Flag to track changes

#                 # Helper function to update fields only if changed
#                 def update_field(obj, field, new_value):
#                     nonlocal updated
#                     if getattr(obj, field) != new_value:
#                         setattr(obj, field, new_value)
#                         updated = True

#                 # Safely handle numeric fields with proper validation
#                 def safe_float(value, default=0.0):
#                     try:
#                         return float(value) if value and str(value).strip() else default
#                     except (ValueError, TypeError):
#                         return default

#                 # Handle brand (existing or new)
#                 existing_jobcardbrand_id = request.POST.get('existing_jobcardbrand')
#                 if not existing_jobcardbrand_id:
#                     # If no brand is selected, show an error message
#                     messages.error(request, "Please select a vehicle brand.")
#                     return redirect(request.path)

#                 if existing_jobcardbrand_id.startswith('new_brand_'):
#                     # Create new brand - use the name as is from the frontend
#                     display_name = existing_jobcardbrand_id.replace('new_brand_', '')
#                     jobcardbrand, created = JobcardBrands.objects.get_or_create(
#                         garage_id=context['garage_id'],
#                         vehicletype=jobcard_obj.vehicletype,
#                         name=display_name.lower().replace(' ', '').replace('_', ''), # Keep URL-friendly name
#                         defaults={'displayname': display_name} # Keep original display name
#                     )
#                 else:
#                     # Get existing brand
#                     try:
#                         jobcardbrand = get_object_or_404(JobcardBrands, id=existing_jobcardbrand_id)
#                     except (ValueError, TypeError):
#                         messages.error(request, "Invalid brand selection.")
#                         return redirect(request.path)
#                 update_field(jobcard_obj, 'vehiclebrand', jobcardbrand)

#                 # Handle model (existing or new)
#                 existing_jobcardmodel_id = request.POST.get('existing_jobcardmodel')
#                 if not existing_jobcardmodel_id:
#                     # If no model is selected, show an error message
#                     messages.error(request, "Please select a vehicle model.")
#                     return redirect(request.path)

#                 if existing_jobcardmodel_id.startswith('new_model_'):
#                     # Create new model
#                     display_name = existing_jobcardmodel_id.replace('new_model_', '')
#                     jobcardmodel, created = JobcardModels.objects.get_or_create(
#                         garage_id=context['garage_id'],
#                         vehicletype=jobcard_obj.vehicletype,
#                         jobcardbrand=jobcardbrand,
#                         name=display_name.lower().replace(' ', '').replace('_', ''), # Keep URL-friendly name
#                         defaults={'displayname': display_name} # Keep original display name
#                     )
#                 else:
#                     # Get existing model and verify it belongs to the selected brand
#                     try:
#                         jobcardmodel = get_object_or_404(
#                             JobcardModels,
#                             id=existing_jobcardmodel_id,
#                             jobcardbrand=jobcardbrand
#                         )
#                     except (ValueError, TypeError):
#                         messages.error(request, "Invalid model selection.")
#                         return redirect(request.path)
#                 update_field(jobcard_obj, 'vehiclemodel', jobcardmodel)

#                 # Handle fuel percentage with validation (0-100)
#                 try:
#                     fuelpercentage = int(request.POST.get('fuelpercentage', 0))
#                     fuelpercentage = max(0, min(100, fuelpercentage))  # Ensure between 0-100
#                 except (ValueError, TypeError):
#                     fuelpercentage = 0
#                 update_field(jobcard_obj, 'fuelpercentage', fuelpercentage)

#                 # Update delivery date and time if provided
#                 delivery_date = request.POST.get('deliverydate') or None
#                 delivery_time = request.POST.get('deliverytime') or None
#                 if delivery_date:
#                     update_field(jobcard_obj, 'delivery_date', datetime.strptime(delivery_date, '%Y-%m-%d').date())
#                 if delivery_time:
#                     update_field(jobcard_obj, 'delivery_time', datetime.strptime(delivery_time, '%H:%M').time())

#                 # Update customer details
#                 if jobcard_obj.customer:
#                     jobcard_obj.customer.name = request.POST.get('customername')
#                     jobcard_obj.customer.comments = request.POST.get('customercomments')
#                     jobcard_obj.customer.save()
#                     updated = True

#                 # # Update dent positions
#                 # dent_positions = request.POST.get('dent_positions')
#                 # if dent_positions is not None:  # Only update if the field was submitted
#                 #     try:
#                 #         dent_positions = json.loads(dent_positions) if dent_positions else None
#                 #         update_field(jobcard_obj, 'dent_positions', dent_positions)
#                 #     except json.JSONDecodeError:
#                 #         pass  # Keep existing value if JSON is invalid

#                 # Update vehicle details
#                 update_field(jobcard_obj, 'vehiclenumber', request.POST.get('vehiclenumber'))
#                 update_field(jobcard_obj, 'dailyrunning', safe_float(request.POST.get('dailyrunning')))
#                 update_field(jobcard_obj, 'odometerreading', safe_float(request.POST.get('odometerreading')))
#                 update_field(jobcard_obj, 'vehiclemileage', safe_float(request.POST.get('vehiclemileage')))
#                 update_field(jobcard_obj, 'vehicleage', safe_float(request.POST.get('vehicleage')))
#                 update_field(jobcard_obj, 'vehiclefueltype', request.POST.get('vehiclefueltype', ''))
#                 update_field(jobcard_obj, 'damagedescription', request.POST.get('damagedescription'))

#                 def process_items(jobcard, items, prefix, model_class, jobcard_relation, status_field=None):
#                     """
#                     Process items for a jobcard (vehicle issues, accessories, service checklist)

#                     Args:
#                         jobcard: The Jobcard instance
#                         items: List of items to process (empty list means remove all items)
#                         prefix: The prefix used to identify new items (e.g., 'new_issue_')
#                         model_class: The model class for the item
#                         jobcard_relation: Dictionary containing 'model' and 'field' keys
#                         status_field: Optional status field name and value as a tuple (field_name, value)
#                     """
#                     nonlocal updated

#                     # Get the related manager name from the model's related_name
#                     related_manager_name = None
#                     for field in jobcard._meta.get_fields():
#                         if hasattr(field, 'related_model') and field.related_model == jobcard_relation['model']:
#                             related_manager_name = field.name
#                             break

#                     if not related_manager_name:
#                         print(f"Warning: Could not find related manager for {jobcard_relation['model'].__name__}")
#                         return

#                     # Get the related manager
#                     related_manager = getattr(jobcard, related_manager_name)

#                     # If items list is empty, remove all relations
#                     if not items:
#                         if related_manager.exists():
#                             related_manager.all().delete()
#                             updated = True
#                         return

#                     field_name = jobcard_relation['field']

#                     # Get current relations
#                     current_relations = list(related_manager.all())
#                     current_ids = {getattr(r, f"{field_name}_id") for r in current_relations}

#                     # Process new and existing items
#                     new_items = []
#                     existing_ids = []

#                     for item in items:
#                         if not item:
#                             continue

#                         if item.startswith(prefix):
#                             # New item
#                             display_name = item[len(prefix):].strip()
#                             if display_name:
#                                 new_items.append(display_name)
#                         else:
#                             # Existing item
#                             try:
#                                 item_id = int(item)
#                                 existing_ids.append(item_id)
#                             except (ValueError, TypeError):
#                                 continue

#                     # Create new items
#                     if new_items:
#                         model_instances = []
#                         for name in new_items:
#                             display_name = name.replace(prefix, '')
#                             model_kwargs = {
#                                 'garage_id': jobcard.garage_id,
#                                 'name': display_name.lower().replace(' ', '').replace('_', ''),
#                                 'displayname': display_name
#                             }
#                             if hasattr(model_class, 'vehicletype'):
#                                 model_kwargs['vehicletype'] = jobcard.vehicletype
#                             model_instances.append(model_class(**model_kwargs))

#                         # Bulk create new items
#                         model_class.objects.bulk_create(
#                             model_instances,
#                             ignore_conflicts=True
#                         )

#                         # Get the created/updated items
#                         name_lower_list = [i.name for i in model_instances]
#                         filter_kwargs = {
#                             'garage_id': jobcard.garage_id,
#                             'name__in': name_lower_list
#                         }
#                         if hasattr(model_class, 'vehicletype'):
#                             filter_kwargs['vehicletype'] = jobcard.vehicletype

#                         new_instances = model_class.objects.filter(**filter_kwargs)
#                         existing_ids.extend([item.id for item in new_instances])

#                     # Create relation objects
#                     relation_objs = []
#                     for item_id in set(existing_ids):
#                         relation_kwargs = {
#                             'jobcard': jobcard,
#                             f"{field_name}_id": item_id
#                         }
#                         if status_field:
#                             relation_kwargs[status_field[0]] = status_field[1]

#                         relation_objs.append(jobcard_relation['model'](**relation_kwargs))

#                     # Delete existing relations and create new ones
#                     related_manager.all().delete()
#                     if relation_objs:
#                         jobcard_relation['model'].objects.bulk_create(relation_objs)
#                         updated = True

#                 # Process vehicle issues
#                 process_items(
#                     jobcard=jobcard_obj,
#                     items=request.POST.getlist('vehicleexistingcommonissues', []),
#                     prefix='new_issue_',
#                     model_class=VehicleCommonIssues,
#                     jobcard_relation={
#                         'model': JobcardVehicleCommonIssues,
#                         'field': 'vehiclecommonissues'
#                     },
#                     status_field=('status', 'active')
#                 )

#                 # Process vehicle accessories
#                 process_items(
#                     jobcard=jobcard_obj,
#                     items=request.POST.getlist('vehicleexistingaccessories', []),
#                     prefix='new_accessory_',
#                     model_class=VehicleAccessories,
#                     jobcard_relation={
#                         'model': JobcardVehicleAccessories,
#                         'field': 'vehicleaccessories'
#                     }
#                 )

#                 # Process service checklist items
#                 process_items(
#                     jobcard=jobcard_obj,
#                     items=request.POST.getlist('service_checklist', []),
#                     prefix='new_checklist_',
#                     model_class=ServiceChecklist,
#                     jobcard_relation={
#                         'model': JobcardServiceChecklist,
#                         'field': 'servicechecklist'
#                     }
#                 )

#                 # Update damage photos
#                 damage_photos = request.FILES.getlist('damagephotos')
#                 removed_photos = json.loads(request.POST.get('removed_photos', '[]'))
#                 saved_photo_paths = []

#                 # Get existing photos, excluding any that were removed
#                 existing_photos = jobcard_obj.damagephotos or []
#                 if removed_photos:
#                     # Remove the static/ prefix if present for comparison
#                     removed_photos = [p.replace('static/', '') if p.startswith('static/') else p for p in removed_photos]
#                     existing_photos = [p for p in existing_photos if p not in removed_photos]

#                 # Remove photos that were marked for deletion
#                 for photo_path in removed_photos:
#                     try:
#                         full_path = os.path.join('static', photo_path)
#                         if os.path.exists(full_path):
#                             os.remove(full_path)
#                             # Remove the directory if it's empty
#                             dir_path = os.path.dirname(full_path)
#                             if os.path.exists(dir_path) and not os.listdir(dir_path):
#                                 os.rmdir(dir_path)
#                     except Exception as e:
#                         print(f"Error removing photo {photo_path}: {str(e)}")

#                 # Save new damage photos if any were uploaded
#                 if damage_photos:
#                     static_dir = os.path.join('static', 'custom-assets', 'damage_photos', str(uuid.uuid4()))
#                     os.makedirs(static_dir, exist_ok=True)
#                     for photo in damage_photos:
#                         try:
#                             ext = os.path.splitext(photo.name)[1].lower()
#                             filename = f"{uuid.uuid4()}{ext}"
#                             file_path = os.path.join(static_dir, filename)
#                             with open(file_path, 'wb+') as destination:
#                                 for chunk in photo.chunks():
#                                     destination.write(chunk)
#                             saved_photo_paths.append(os.path.join('custom-assets', 'damage_photos', os.path.basename(static_dir), filename))
#                         except Exception as e:
#                             print(f"Error saving new photo {photo.name}: {str(e)}")
#                             continue

#                 # Combine existing (non-removed) and new photos
#                 all_photos = existing_photos + saved_photo_paths
#                 update_field(jobcard_obj, 'damagephotos', all_photos)

#                 # Save only if any field was updated
#                 if updated:
#                     jobcard_obj.save()
#                     messages.success(request, "Job card updated successfully!")
#                 else:
#                     messages.info(request, "No changes were made.")

#                 # calling functions
#                 audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'u_txn_job_sheets', 200)
#         except (ValidationError, Exception) as e:
#             error_msg = ', '.join(e.messages) if isinstance(e, ValidationError) else str(e)
#             audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', error_msg, 400)
#             messages.error(request, error_msg)
#             logging.getLogger(__name__).error(f"Exception: {request.path}: {error_msg}")
#         return redirect(request.path)
