import logging
import os
from datetime import datetime
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render

from GMSApp.models import ProductCatalogues, StockInwards, Suppliers
from GMSApp.modules import audit, managesession, templatespath


@managesession.check_session_timeout
def r_inv_stock_inward(request, context):
    if request.method == "GET":
        garage_id = context["garage_id"]
        product_catalogues = ProductCatalogues.objects.filter(garage_id=garage_id).only(
            "id", "name", "part_number", "code"
        )
        suppliers = Suppliers.objects.filter(garage_id=garage_id).only("id", "supplier")
        stock_inwards = (
            StockInwards.objects.filter(garage_id=garage_id)
            .select_related("product", "supplier")
            .order_by("-id")
        )

        # Add calculated purchase price to each stock inward record
        for stock_inward in stock_inwards:
            base_mrp = (
                stock_inward.rate / (1 + stock_inward.gst / 100)
                if stock_inward.price_includes_gst
                else stock_inward.rate
            )
            stock_inward.calculated_purchase_price = base_mrp - (
                base_mrp * stock_inward.discount / 100
            )

        # Pagination
        paginator = Paginator(stock_inwards, 100)
        page_number = request.GET.get("page")
        page_obj = paginator.get_page(page_number)
        context["stock_inward"] = page_obj
        context["product_catalogues"] = product_catalogues
        context["suppliers"] = suppliers

        # calling functions
        audit.create_audit_log(
            context["useremail"],
            f"USER: {context['useremail']}, {request.method}: {request.path}",
            "r_inv_stock_inward",
            200,
        )
        return render(request, templatespath.template_r_inv_stock_inward, context)

    if request.method == "POST":
        try:
            with transaction.atomic():
                # Extract form data
                product_id = request.POST.get("product")
                quantity = int(request.POST.get("quantity") or 0)
                supplier_id = request.POST.get("supplier")
                supplier_invoice_no = request.POST.get("supplier_invoice_no")
                supplier_invoice_date = (
                    request.POST.get("supplier_invoice_date") or None
                )
                location = request.POST.get("location")
                rack = request.POST.get("rack")
                track_expiry = (
                    request.POST.get("track_expiry") == "on"
                )  # Convert checkbox value to boolean
                expiry_date = request.POST.get("expiry_date") or None
                warranty = request.POST.get("warranty") or None
                remarks = request.POST.get("remarks")

                # Extract pricing fields from form
                rate = Decimal(request.POST.get("rate") or 0)
                discount = Decimal(
                    request.POST.get("discount") or 0
                )  # This is discount percentage
                gst = Decimal(request.POST.get("gst") or 0)
                price_includes_gst = request.POST.get("price_includes_gst") == "on"
                purchase_price = Decimal(request.POST.get("purchase_price") or 0)

                # Convert dates
                if supplier_invoice_date:
                    supplier_invoice_date = datetime.strptime(
                        supplier_invoice_date, "%Y-%m-%d"
                    ).date()
                if expiry_date:
                    expiry_date = datetime.strptime(expiry_date, "%Y-%m-%d").date()
                if warranty:
                    warranty = datetime.strptime(warranty, "%Y-%m-%dT%H:%M")

                # Ensure required fields are provided
                if not product_id or not supplier_id:
                    raise ValueError("Product and Supplier are required.")

                # Fetch related objects
                product = get_object_or_404(ProductCatalogues, id=product_id)
                supplier = get_object_or_404(Suppliers, id=supplier_id)

                # Calculate total price based on form values
                total_price = rate * quantity
                # Add GST to total price
                total_price = total_price + (total_price * gst / 100)

                # Handle file upload
                supplier_invoice_path = None
                if "supplier_invoice_path" in request.FILES:
                    supplier_invoice_file = request.FILES["supplier_invoice_path"]
                    trimmed_filename = supplier_invoice_file.name.strip().replace(
                        " ", "_"
                    )
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"product_id_{product_id}_{current_datetime}{ext}"
                    directory = (
                        "static/custom-assets/supplier-invoice/"  # Target directory
                    )
                    file_path = os.path.join(directory, new_filename)
                    # Ensure the directory exists
                    os.makedirs(directory, exist_ok=True)
                    # Save the uploaded file to the filesystem
                    with open(file_path, "wb+") as destination:
                        for chunk in supplier_invoice_file.chunks():
                            destination.write(chunk)
                    supplier_invoice_path = file_path

                # Create stock inward entry
                stock_inward = StockInwards.objects.create(
                    garage_id=context["garage_id"],
                    product=product,
                    quantity=quantity,
                    rate=rate,
                    discount=discount,
                    gst=gst,
                    total_price=total_price,
                    price_includes_gst=price_includes_gst,
                    supplier=supplier,
                    supplier_invoice_no=supplier_invoice_no,
                    supplier_invoice_date=supplier_invoice_date,
                    supplier_invoice_path=supplier_invoice_path,
                    location=location,
                    rack=rack,
                    track_expiry=track_expiry,
                    expiry_date=expiry_date,
                    warranty=warranty,
                    remarks=remarks,
                )

                # Update inward_stock in ProductCatalogues
                product.inward_stock += quantity
                product.save()

                # calling functions
                audit.create_audit_log(
                    context["useremail"],
                    f"USER: {context['useremail']}, {request.method}: {request.path}",
                    "r_inv_stock_inward",
                    200,
                )
                return JsonResponse(
                    {"status": True, "message": "Stock Inward created successfully"}
                )
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
            return JsonResponse({"status": False, "message": error_msg})


@managesession.check_session_timeout
def u_inv_stock_inward(request, context, id):
    if request.method == "POST":
        try:
            with transaction.atomic():
                updated = False  # Flag to track if any value is updated

                # Fetch the stock inward entry
                stock_inward_obj = get_object_or_404(StockInwards, id=id)

                # Helper function to update fields only if changed
                def update_field(obj, field, new_value):
                    nonlocal updated
                    if getattr(obj, field) != new_value:
                        setattr(obj, field, new_value)
                        updated = True

                # Extract form data
                product_id = request.POST.get("product")
                quantity = int(request.POST.get("quantity") or 0)
                supplier_id = request.POST.get("supplier")
                supplier_invoice_no = request.POST.get("supplier_invoice_no")
                supplier_invoice_date = (
                    request.POST.get("supplier_invoice_date") or None
                )
                location = request.POST.get("location")
                rack = request.POST.get("rack")
                track_expiry = request.POST.get("track_expiry") == "on"
                expiry_date = request.POST.get("expiry_date") or None
                warranty = request.POST.get("warranty") or None
                remarks = request.POST.get("remarks")

                # Extract pricing fields from form
                rate = Decimal(request.POST.get("rate") or 0)
                discount = Decimal(
                    request.POST.get("discount") or 0
                )  # This is discount percentage
                gst = Decimal(request.POST.get("gst") or 0)
                price_includes_gst = request.POST.get("price_includes_gst") == "on"
                purchase_price = Decimal(request.POST.get("purchase_price") or 0)

                # Convert dates
                if supplier_invoice_date:
                    supplier_invoice_date = datetime.strptime(
                        supplier_invoice_date, "%Y-%m-%d"
                    ).date()
                if expiry_date:
                    expiry_date = datetime.strptime(expiry_date, "%Y-%m-%d").date()
                if warranty:
                    warranty = datetime.strptime(warranty, "%Y-%m-%dT%H:%M")

                # Fetch related objects
                product = get_object_or_404(ProductCatalogues, id=product_id)
                supplier = get_object_or_404(Suppliers, id=supplier_id)

                # Calculate total price based on form values
                total_price = rate * quantity
                # Add GST to total price
                total_price = total_price + (total_price * gst / 100)

                # Adjust stock in ProductCatalogues if product or quantity changes
                if stock_inward_obj.product != product:
                    # Reduce stock from old product
                    stock_inward_obj.product.inward_stock -= stock_inward_obj.quantity
                    stock_inward_obj.product.save()
                    # Add stock to new product
                    product.inward_stock += quantity
                    product.save()
                elif stock_inward_obj.quantity != quantity:
                    # Adjust inward stock only if quantity changed
                    product.inward_stock += quantity - stock_inward_obj.quantity
                    product.save()

                # Update fields if changed
                update_field(stock_inward_obj, "product", product)
                update_field(stock_inward_obj, "quantity", quantity)
                update_field(stock_inward_obj, "rate", rate)
                update_field(stock_inward_obj, "discount", discount)
                update_field(stock_inward_obj, "gst", gst)
                update_field(stock_inward_obj, "total_price", total_price)
                update_field(stock_inward_obj, "price_includes_gst", price_includes_gst)
                update_field(stock_inward_obj, "supplier", supplier)
                update_field(
                    stock_inward_obj, "supplier_invoice_no", supplier_invoice_no
                )
                update_field(
                    stock_inward_obj, "supplier_invoice_date", supplier_invoice_date
                )
                update_field(stock_inward_obj, "location", location)
                update_field(stock_inward_obj, "rack", rack)
                update_field(stock_inward_obj, "track_expiry", track_expiry)
                update_field(stock_inward_obj, "expiry_date", expiry_date)
                update_field(stock_inward_obj, "warranty", warranty)
                update_field(stock_inward_obj, "remarks", remarks)

                # Handle file update
                if "supplier_invoice_path" in request.FILES:
                    supplier_invoice_file = request.FILES["supplier_invoice_path"]
                    trimmed_filename = supplier_invoice_file.name.strip().replace(
                        " ", "_"
                    )
                    current_datetime = datetime.now().strftime("%Y%m%d_%H%M%S")
                    name, ext = os.path.splitext(trimmed_filename)
                    new_filename = f"product_id_{product_id}_{current_datetime}{ext}"
                    directory = "static/custom-assets/supplier-invoice/"
                    file_path = os.path.join(directory, new_filename)

                    # Ensure directory exists
                    os.makedirs(directory, exist_ok=True)

                    # Delete old file if exists
                    if stock_inward_obj.supplier_invoice_path:
                        old_invoice_path = os.path.join(
                            settings.BASE_DIR, stock_inward_obj.supplier_invoice_path
                        )
                        if os.path.exists(old_invoice_path):
                            os.remove(old_invoice_path)

                    # Save new file
                    with open(file_path, "wb+") as destination:
                        for chunk in supplier_invoice_file.chunks():
                            destination.write(chunk)

                    # Update file path
                    update_field(stock_inward_obj, "supplier_invoice_path", file_path)

                # Save only if any field was updated
                if updated:
                    stock_inward_obj.save()

                # calling functions
                audit.create_audit_log(
                    context["useremail"],
                    f"USER: {context['useremail']}, {request.method}: {request.path}",
                    "u_inv_stock_inward",
                    200,
                )
                if updated:
                    return JsonResponse(
                        {"status": True, "message": "Stock Inward updated successfully"}
                    )
                else:
                    return JsonResponse(
                        {"status": True, "message": "No changes were made"}
                    )
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
            return JsonResponse({"status": False, "message": error_msg})


@managesession.check_session_timeout
def d_inv_stock_inward(request, context):
    if request.method == "POST":
        try:
            with transaction.atomic():
                stock_inward_ids = request.POST.getlist("id[]")
                deleted_data = []
                for id in stock_inward_ids:
                    stock_inward_obj = StockInwards.objects.filter(id=id).first()
                    if stock_inward_obj:
                        deleted_data.append(stock_inward_obj.id)
                        stock_inward_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} stock inward deleted"
                    sts = True
                else:
                    msg = "Failed to delete stock inward"
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
