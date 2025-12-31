import logging
from datetime import datetime
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render

from GMSApp.models import ProductCatalogues, StockOutwards
from GMSApp.modules import audit, managesession, templatespath


@managesession.check_session_timeout
def r_inv_stock_outward(request, context):
    if request.method == "GET":
        garage_id = context["garage_id"]
        product_catalogues = (
            ProductCatalogues.objects.filter(garage_id=garage_id, inward_stock__gt=0)
            .only("id", "name", "inward_stock", "outward_stock", "part_number", "code")
            .order_by("name")
        )
        stock_outwards = (
            StockOutwards.objects.filter(garage_id=garage_id)
            .select_related("product")
            .order_by("-id")
        )

        # Pagination
        paginator = Paginator(stock_outwards, 100)
        page_number = request.GET.get("page")
        page_obj = paginator.get_page(page_number)
        context["stock_outward"] = page_obj
        context["product_catalogues"] = product_catalogues

        # calling functions
        audit.create_audit_log(
            context["useremail"],
            f"USER: {context['useremail']}, {request.method}: {request.path}",
            "r_inv_stock_outward",
            200,
        )
        return render(request, templatespath.template_r_inv_stock_outward, context)

    if request.method == "POST":
        try:
            with transaction.atomic():
                # Extract form data
                product_id = request.POST.get("product")
                quantity = int(request.POST.get("quantity") or 0)
                issued_to = request.POST.get("issued_to")
                issued_date = request.POST.get("issued_date") or None
                usage_purpose = request.POST.get("usage_purpose")
                reference_document = request.POST.get("reference_document")
                location = request.POST.get("location")
                rack = request.POST.get("rack")
                remarks = request.POST.get("remarks")

                # Convert dates
                if issued_date:
                    issued_date = datetime.strptime(issued_date, "%Y-%m-%d").date()

                # Ensure required fields are provided
                if not product_id:
                    raise ValueError("Product are required.")

                # Fetch related objects
                product = get_object_or_404(ProductCatalogues, id=product_id)

                # Use product defaults if not provided
                rate = product.price or Decimal(0.0)
                discount = product.discount or Decimal(0.0)
                gst = product.gst or Decimal(0.0)
                total_price = rate * quantity
                if not product.price_includes_gst:
                    total_price = total_price + (total_price * gst / 100)

                # Reduce stock in ProductCatalogues
                if product.current_stock < quantity:
                    raise ValueError(
                        f"Insufficient stock for {product.name}. Available: {product.current_stock}, Required: {quantity}"
                    )

                # Update stock in ProductCatalogues
                product.outward_stock += quantity
                product.save()

                # Create stock outward entry
                stock_outward = StockOutwards.objects.create(
                    garage_id=context["garage_id"],
                    product=product,
                    quantity=quantity,
                    rate=rate,
                    discount=discount,
                    gst=gst,
                    total_price=total_price,
                    issued_to=issued_to,
                    issued_date=issued_date,
                    usage_purpose=usage_purpose,
                    reference_document=reference_document,
                    location=location,
                    rack=rack,
                    remarks=remarks,
                )

                # calling functions
                audit.create_audit_log(
                    context["useremail"],
                    f"USER: {context['useremail']}, {request.method}: {request.path}",
                    "r_inv_stock_outward",
                    200,
                )
                return JsonResponse(
                    {"status": True, "message": "Stock Outward created successfully"}
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
def u_inv_stock_outward(request, context, id):
    if request.method == "POST":
        try:
            with transaction.atomic():
                updated = False  # Flag to track if any value is updated

                # Fetch the stock outward entry
                stock_outward_obj = get_object_or_404(StockOutwards, id=id)

                # Helper function to update fields only if changed
                def update_field(obj, field, new_value):
                    nonlocal updated
                    if getattr(obj, field) != new_value:
                        setattr(obj, field, new_value)
                        updated = True

                # Extract form data
                product_id = request.POST.get("product")
                quantity = int(request.POST.get("quantity") or 0)
                issued_to = request.POST.get("issued_to")
                issued_date = request.POST.get("issued_date") or None
                usage_purpose = request.POST.get("usage_purpose")
                reference_document = request.POST.get("reference_document")
                location = request.POST.get("location")
                rack = request.POST.get("rack")
                remarks = request.POST.get("remarks")

                # Convert dates
                if issued_date:
                    issued_date = datetime.strptime(issued_date, "%Y-%m-%d").date()

                # Fetch related objects
                product = get_object_or_404(ProductCatalogues, id=product_id)

                rate = product.price or Decimal(0.0)
                discount = product.discount or Decimal(0.0)
                gst = product.gst or Decimal(0.0)
                total_price = rate * quantity
                if not product.price_includes_gst:
                    total_price = total_price + (total_price * gst / 100)

                # Adjust stock in ProductCatalogues if product or quantity changes
                if stock_outward_obj.product != product:
                    # Reduce stock from old product
                    stock_outward_obj.product.outward_stock -= (
                        stock_outward_obj.quantity
                    )
                    stock_outward_obj.product.save()
                    # Check stock availability for new product
                    if product.current_stock < quantity:
                        raise ValueError(
                            f"Insufficient stock for {product.name}. Available: {product.current_stock}, Required: {quantity}"
                        )
                    # Add stock to new product
                    product.outward_stock += quantity
                    product.save()
                elif stock_outward_obj.quantity != quantity:
                    # Check stock availability
                    if product.current_stock < (quantity - stock_outward_obj.quantity):
                        raise ValueError(
                            f"Insufficient stock for {product.name}. Available: {product.current_stock}, Required: {quantity}"
                        )
                    # Adjust outward stock only if quantity changed
                    product.outward_stock += quantity - stock_outward_obj.quantity
                    product.save()

                # Update fields if changed
                update_field(stock_outward_obj, "product", product)
                update_field(stock_outward_obj, "quantity", quantity)
                update_field(stock_outward_obj, "rate", rate)
                update_field(stock_outward_obj, "discount", discount)
                update_field(stock_outward_obj, "gst", gst)
                update_field(stock_outward_obj, "total_price", total_price)
                update_field(stock_outward_obj, "issued_to", issued_to)
                update_field(stock_outward_obj, "issued_date", issued_date)
                update_field(stock_outward_obj, "usage_purpose", usage_purpose)
                update_field(
                    stock_outward_obj, "reference_document", reference_document
                )
                update_field(stock_outward_obj, "location", location)
                update_field(stock_outward_obj, "rack", rack)
                update_field(stock_outward_obj, "remarks", remarks)

                # Save only if any field was updated
                if updated:
                    stock_outward_obj.save()

                # calling functions
                audit.create_audit_log(
                    context["useremail"],
                    f"USER: {context['useremail']}, {request.method}: {request.path}",
                    "u_inv_stock_outward",
                    200,
                )
                if updated:
                    return JsonResponse(
                        {
                            "status": True,
                            "message": "Stock Outward updated successfully",
                        }
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
def d_inv_stock_outward(request, context):
    if request.method == "POST":
        try:
            with transaction.atomic():
                stock_outward_ids = request.POST.getlist("id[]")
                deleted_data = []
                for id in stock_outward_ids:
                    stock_outward_obj = StockOutwards.objects.filter(id=id).first()
                    if stock_outward_obj:
                        deleted_data.append(stock_outward_obj.id)
                        stock_outward_obj.delete()

                if deleted_data:
                    msg = f"{len(deleted_data)} stock outward deleted"
                    sts = True
                else:
                    msg = "Failed to delete stock outward"
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
