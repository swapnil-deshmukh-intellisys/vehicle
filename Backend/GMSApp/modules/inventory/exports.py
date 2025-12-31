import csv
from datetime import datetime

from django.http import HttpResponse

from GMSApp.models import ProductCatalogues, StockInwards, StockOutwards
from GMSApp.modules import managesession


@managesession.check_session_timeout
def export_product_catalogues_csv(request, context):
    garage_id = context['garage_id']
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="product_catalogues_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'HSN Code', 'Name', 'Part Number', 'Model', 'CC', 'Category', 'Sub Category', 
        'Brand', 'Description', 'Inward Stock', 'Outward Stock', 'Current Stock',
        'Price', 'GST %', 'Discount %', 'Purchase Price', 'Measuring Unit', 
        'Min Stock', 'Price Includes GST', 'Stock Status', 'Created At', 'Updated At'
    ])
    
    products = ProductCatalogues.objects.filter(garage_id=garage_id).select_related('category', 'brand')
    for product in products:
        writer.writerow([
            product.code or '',
            product.name,
            product.part_number or '',
            product.model or '',
            product.cc or '',
            product.category.name if product.category else '',
            product.sub_category or '',
            product.brand.name if product.brand else '',
            product.description or '',
            product.inward_stock,
            product.outward_stock,
            product.current_stock,
            product.price,
            product.gst,
            product.discount,
            product.purchase_price,
            product.measuring_unit,
            product.min_stock,
            'Yes' if product.price_includes_gst else 'No',
            product.stock_status,
            product.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            product.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    
    return response


@managesession.check_session_timeout
def export_stock_inwards_csv(request, context):
    garage_id = context['garage_id']
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="stock_inwards_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'Product Name', 'HSN Code', 'Brand', 'Quantity', 'Rate', 'Discount %', 
        'GST %', 'Total Price', 'Supplier', 'Invoice No', 'Invoice Date', 
        'Location', 'Rack', 'Track Expiry', 'Expiry Date', 'Warranty', 
        'Remarks', 'Created At', 'Updated At'
    ])
    
    stock_inwards = StockInwards.objects.filter(garage_id=garage_id).select_related('product', 'product__brand', 'supplier')
    for stock in stock_inwards:
        writer.writerow([
            stock.product.name,
            stock.product.code or '',
            stock.product.brand.name if stock.product.brand else '',
            stock.quantity,
            stock.rate,
            stock.discount,
            stock.gst,
            stock.total_price,
            stock.supplier.supplier,
            stock.supplier_invoice_no or '',
            stock.supplier_invoice_date.strftime('%Y-%m-%d') if stock.supplier_invoice_date else '',
            stock.location or '',
            stock.rack or '',
            'Yes' if stock.track_expiry else 'No',
            stock.expiry_date.strftime('%Y-%m-%d') if stock.expiry_date else '',
            stock.warranty.strftime('%Y-%m-%d %H:%M:%S') if stock.warranty else '',
            stock.remarks or '',
            stock.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            stock.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    
    return response


@managesession.check_session_timeout
def export_stock_outwards_csv(request, context):
    garage_id = context['garage_id']
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="stock_outwards_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'Product Name', 'HSN Code', 'Brand', 'Quantity', 'Rate', 'Discount %', 
        'GST %', 'Total Price', 'Issued To', 'Issued Date', 'Usage Purpose', 
        'Reference Document', 'Location', 'Rack', 'Remarks', 'Created At', 'Updated At'
    ])
    
    stock_outwards = StockOutwards.objects.filter(garage_id=garage_id).select_related('product', 'product__brand')
    for stock in stock_outwards:
        writer.writerow([
            stock.product.name,
            stock.product.code or '',
            stock.product.brand.name if stock.product.brand else '',
            stock.quantity,
            stock.rate,
            stock.discount,
            stock.gst,
            stock.total_price,
            stock.issued_to or '',
            stock.issued_date.strftime('%Y-%m-%d') if stock.issued_date else '',
            stock.usage_purpose or '',
            stock.reference_document or '',
            stock.location or '',
            stock.rack or '',
            stock.remarks or '',
            stock.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            stock.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    
    return response