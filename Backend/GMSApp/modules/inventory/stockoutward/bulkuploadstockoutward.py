from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db.models import F
from django.contrib import messages
from django.db import transaction
from GMSApp.models import ProductCatalogues, StockOutwards
from GMSApp.modules import managesession, audit
from datetime import datetime, date
import logging, csv, io, os
import pandas as pd


@managesession.check_session_timeout
def bulk_upload_stock_outward(request, context):
    if request.method == 'POST':
        try:
            if 'stock_outward_file' not in request.FILES:
                raise ValidationError('No stock outward file was uploaded.')

            stock_outward_file = request.FILES['stock_outward_file']
            file_extension = stock_outward_file.name.lower().rsplit('.', 1)[-1]
            VALID_EXTENSIONS = {'csv', 'xls', 'xlsx'}

            if file_extension not in VALID_EXTENSIONS:
                raise ValidationError('Please upload a valid Excel or CSV file.')

            df = pd.read_csv(io.StringIO(stock_outward_file.read().decode('utf-8'))) \
                if file_extension == 'csv' else pd.read_excel(stock_outward_file)

            if df.empty:
                raise ValidationError('The uploaded file is empty.')

            df.columns = df.columns.str.strip().str.lower()

            REQUIRED_COLUMNS = [
                'product_id', 'issued_to'
            ]
            OPTIONAL_COLUMNS = [
                'quantity', 'rate', 'discount', 'gst', 'total_price', 'issued_date', 'usage_purpose', 'reference_document', 'location', 'rack', 'remarks'
            ]

            # Check for missing required columns
            missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
            if missing_columns:
                raise ValidationError(f'Missing required columns: {", ".join(missing_columns)}')

            # Check for empty required values
            empty_required = [
                col for col in REQUIRED_COLUMNS
                if df[col].isna().any() or df[col].astype(str).str.strip().eq('').any()
            ]
            if empty_required:
                raise ValidationError(f'Empty values found in required columns: {", ".join(empty_required)}')

            # Clean optional columns
            for col in OPTIONAL_COLUMNS:
                if col in df.columns:
                    df[col] = df[col].fillna('').astype(str).replace({'nan': '', 'NaN': '', 'None': ''})

            # Save uploaded file for audit/debug
            upload_dir = os.path.join('static', 'stockoutwardbulkuploadedfiles')
            os.makedirs(upload_dir, exist_ok=True)
            original_name, ext = os.path.splitext(stock_outward_file.name)
            safe_original = "_".join(original_name.split())
            current_time = datetime.now().strftime('%Y%m%d_%H%M%S')
            saved_filename = f"garage_id_{context['garage_id']}_{safe_original}_{current_time}{ext}"
            file_path = os.path.join(upload_dir, saved_filename)
            with open(file_path, 'wb+') as destination:
                for chunk in stock_outward_file.chunks():
                    destination.write(chunk)

            success_count = 0
            failure_count = 0
            errors = []

            for index, row in df.iterrows():
                try:             
                    quantity = int(row['quantity'] or 0)
                    if quantity <= 0:
                        raise ValueError("Quantity must be greater than 0.")                    
                    rate = float(row['rate'] or 0.0)
                    discount = float(row['discount'] or 0.0)
                    gst = float(row['gst'] or 0.0)
                    total_price = float(row['total_price'] or 0.0)
                    issued_to = row['issued_to']
                    issued_date = row['issued_date'] or None  
                    usage_purpose = row['usage_purpose']
                    reference_document = row['reference_document']
                    location = row['location']
                    rack = row['rack']
                    remarks = row['remarks']

                    if issued_date:
                        try:
                            issued_date = datetime.strptime(issued_date, "%Y-%m-%d").date()
                        except ValueError:
                            raise ValidationError(f"Invalid issued_date format: {issued_date}")

                    # Fetch related objects
                    product = get_object_or_404(ProductCatalogues, id=row['product_id'])

                    # Reduce stock in ProductCatalogues
                    if product.current_stock < quantity:
                        raise ValueError(f"Insufficient stock for {product.name}. Available: {product.current_stock}, Required: {quantity}")
                                       
                    # Create stock outward entry
                    stock_outward = StockOutwards.objects.create(
                        garage_id=context['garage_id'],
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

                    # Update stock in ProductCatalogues
                    product.outward_stock += quantity
                    product.save()

                    success_count += 1
                except Exception as e:
                    failure_count += 1
                    errors.append(f"Row {index+2}: {str(e)}")  # Excel-style row number

            # Final message
            msg = f"✅ Uploaded {success_count} products.\n"
            if failure_count:
                msg += f"❌ Failed: {failure_count} rows.\n"
                for err in errors[:10]:  # show up to 10 errors
                    msg += f"- {err}\n"

            if success_count > 0:
                messages.success(request, msg)
            else:
                messages.error(request, msg)

            audit.create_audit_log(
                context['useremail'],
                f'Bulk uploaded stock. Success: {success_count}, Failures: {failure_count}',
                'bulk_upload_stock_outward',
                200 if success_count else 400
            )

        except ValidationError as e:
            msg = ', '.join(e.messages) if hasattr(e, 'messages') else str(e)
            messages.error(request, msg)
            audit.create_audit_log(context['useremail'], f'Bulk upload failed: {msg[:200]}', 'bulk_upload_stock_outward', 400)

        except Exception as e:
            messages.error(request, 'Unexpected error during file upload.')
            logging.exception("Unexpected error in bulk_upload_stock_outward")
            audit.create_audit_log(context['useremail'], 'Bulk upload failed: Unexpected error', 'bulk_upload_stock_outward', 500)

        return redirect('r-inv-stock-outward')
