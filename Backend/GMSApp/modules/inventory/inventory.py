from django.shortcuts import render, redirect, get_object_or_404
from GMSApp.modules import templatespath, managesession, audit
from django.contrib import messages
from GMSApp.models import ProductCatalogues, StockOutwards, StockInwards, Suppliers, ProductCategories, ProductBrands, ProductModel

@managesession.check_session_timeout
def r_inventory(request, context):
    if request.method == 'GET':
        context['product_catalogues_count'] = ProductCatalogues.objects.filter(garage_id=context['garage_id']).count()
        context['stock_outwards_count'] = StockOutwards.objects.filter(garage_id=context['garage_id']).count()
        context['stock_inwards_count'] = StockInwards.objects.filter(garage_id=context['garage_id']).count()
        context['suppliers_count'] = Suppliers.objects.filter(garage_id=context['garage_id']).count()
        context['product_categories_count'] = ProductCategories.objects.filter(garage_id=context['garage_id']).count()
        context['product_brands_count'] = ProductBrands.objects.filter(garage_id=context['garage_id']).count()
        context['product_model_count'] = ProductModel.objects.filter(brand__garage_id=context['garage_id']).count()

        # calling functions
        audit.create_audit_log(context['useremail'], f'USER: {context["useremail"]}, {request.method}: {request.path}', 'r_inventory', 200)
        return render(request, templatespath.template_r_inventory, context)


