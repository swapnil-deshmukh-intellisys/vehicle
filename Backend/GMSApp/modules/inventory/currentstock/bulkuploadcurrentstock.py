from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db.models import F
from django.contrib import messages
from django.db import transaction
from GMSApp.models import ProductCatalogues, ProductCategories, ProductBrands
from GMSApp.modules import managesession, audit
from datetime import datetime, date
import logging, csv, io, os
import pandas as pd


@managesession.check_session_timeout
def bulk_upload_current_stock(request, context):
    if request.method == 'POST':
        try:
            if 'current_stock_file' not in request.FILES:
                raise ValidationError('No current stock file was uploaded.')

            current_stock_file = request.FILES['current_stock_file']
            file_extension = current_stock_file.name.lower().rsplit('.', 1)[-1]
            VALID_EXTENSIONS = {'csv', 'xls', 'xlsx'}

            if file_extension not in VALID_EXTENSIONS:
                raise ValidationError('Please upload a valid Excel or CSV file.')

            df = pd.read_csv(io.StringIO(current_stock_file.read().decode('utf-8'))) \
                if file_extension == 'csv' else pd.read_excel(current_stock_file)

            if df.empty:
                raise ValidationError('The uploaded file is empty.')

            df.columns = df.columns.str.strip().str.lower()

            REQUIRED_COLUMNS = [
                'name', 'category_id', 'brand_id'
            ]
            OPTIONAL_COLUMNS = [
                'code', 'part_number', 'model', 'cc', 'sub_category', 'description', 'price', 'gst', 'discount', 'purchase_price', 'measuring_unit'
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
            upload_dir = os.path.join('static', 'currentstockbulkuploadedfiles')
            os.makedirs(upload_dir, exist_ok=True)
            original_name, ext = os.path.splitext(current_stock_file.name)
            safe_original = "_".join(original_name.split())
            current_time = datetime.now().strftime('%Y%m%d_%H%M%S')
            saved_filename = f"garage_id_{context['garage_id']}_{safe_original}_{current_time}{ext}"
            file_path = os.path.join(upload_dir, saved_filename)
            with open(file_path, 'wb+') as destination:
                for chunk in current_stock_file.chunks():
                    destination.write(chunk)

            success_count = 0
            failure_count = 0
            errors = []

            for index, row in df.iterrows():
                try:
                    category_id = int(row['category_id'])
                    brand_id = int(row['brand_id'])

                    # Fetch foreign key objects
                    category = get_object_or_404(ProductCategories, id=category_id, garage_id=context['garage_id'])
                    brand = get_object_or_404(ProductBrands, id=brand_id, garage_id=context['garage_id'])

                    # Extract file data                    
                    name = row['name']
                    code = row['code']
                    part_number = row['part_number']
                    model = row['model']
                    cc = row['cc']
                    sub_category = row['sub_category']
                    description = row['description']

                    # Convert numerical values safely
                    price = float(row['price'] or 0.00)
                    gst = float(row['gst'] or 0.00)
                    discount = float(row['discount'] or 0.00)
                    purchase_price = float(row['purchase_price'] or 0.00)

                    measuring_unit = row['measuring_unit']                   

                    # update or create
                    product_catalogues_obj, created = ProductCatalogues.objects.update_or_create(
                        garage_id=context['garage_id'],
                        name=name,
                        category=category,
                        brand=brand,
                        defaults={
                            'code': code,
                            'part_number': part_number,
                            'model': model,
                            'cc': cc,
                            'sub_category': sub_category,
                            'description': description,
                            'price': price,
                            'gst': gst,
                            'discount': discount,
                            'purchase_price': purchase_price,
                            'measuring_unit': measuring_unit
                        }
                    )
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
                'bulk_upload_current_stock',
                200 if success_count else 400
            )

        except ValidationError as e:
            msg = ', '.join(e.messages) if hasattr(e, 'messages') else str(e)
            messages.error(request, msg)
            audit.create_audit_log(context['useremail'], f'Bulk upload failed: {msg[:200]}', 'bulk_upload_current_stock', 400)

        except Exception as e:
            messages.error(request, 'Unexpected error during file upload.')
            logging.exception("Unexpected error in bulk_upload_current_stock")
            audit.create_audit_log(context['useremail'], 'Bulk upload failed: Unexpected error', 'bulk_upload_current_stock', 500)

        return redirect('r-inv-current-stock')
