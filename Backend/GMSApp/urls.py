from django.urls import path
from django.views.generic import TemplateView

from GMSApp import views
from GMSApp.modules.api.customerUI.garage.fetchgarage import GarageDetailAPIView
from GMSApp.modules.api.customerUI.garage.listaccessories import AccessoryListAPIView
from GMSApp.modules.api.customerUI.garage.listbrand import BrandListAPIView
from GMSApp.modules.api.customerUI.garage.listgarage import ListGarageAPIView
from GMSApp.modules.api.customerUI.garage.listgarageservice import (
    GarageServiceListAPIView,
)
from GMSApp.modules.api.customerUI.garage.listmodel import ModelListAPIView
from GMSApp.modules.api.customerUI.location.listcity import ActiveCityListAPIView
from GMSApp.modules.api.customerUI.login.sendsms import SendSMSAPI
from GMSApp.modules.api.customerUI.login.verifyotp import VerifyOTPAPI
from GMSApp.modules.api.customerUI.subscriber.address import (
    ListSubscriberAddressAPI,
    SubscriberAddressAPI,
)
from GMSApp.modules.api.customerUI.subscriber.booking import (
    BookingStatusUpdateView,
    SubscriberBookingAPI,
)
from GMSApp.modules.api.customerUI.subscriber.bookingreview import (
    SubscriberBookingReviewAPIView,
)
from GMSApp.modules.api.customerUI.subscriber.profile import SubscriberProfileAPIView
from GMSApp.modules.api.customerUI.subscriber.vehicle import (
    ListSubscriberVehicleAPI,
    SubscriberVehicleAPI,
)

auditlog_urls = [
    path('r-auditlog/', views.r_auditlog, name='r-auditlog'),
    path('d-auditlog/', views.d_auditlog, name='d-auditlog'),
]

roles_urls = [
    path('c-roles/', views.c_roles, name='c-roles'),
    path('r-roles/', views.r_roles, name='r-roles'),
    path('u-roles/<int:id>/', views.u_roles, name='u-roles'),
    path('d-roles/', views.d_roles, name='d-roles'),
]

users_urls = [
    path('r-users/', views.r_users, name='r-users'),
    path('c-users/', views.c_users, name='c-users'),
    path('get-garages-by-group/', views.get_garages_by_group, name='get_garages_by_group'),
    path('u-users/<int:id>/', views.u_users, name='u-users'),
    path('u-users-password/<int:id>/', views.u_users_password, name='u-users-password'),
    path('d-users/', views.d_users, name='d-users'),   
    path('r-users-profile/', views.r_users_profile, name='r-users-profile'),
]

transactions_urls = [
    # for invoice
    path('r-transactions/', views.r_transactions, name='r-transactions'),
    path('r-txn-invoices/', views.r_txn_invoices, name='r-txn-invoices'),
    path('d-txn-invoices/', views.d_txn_invoices, name='d-txn-invoices'),
    path('c-txn-invoices/', views.c_txn_invoices, name='c-txn-invoices'),   
    path('bulk-upload-invoices/', views.bulk_upload_invoices, name='bulk-upload-invoices'),    
    path('track-invoice-uploads/<int:id>/', views.track_invoice_uploads, name='track-invoice-uploads'),
    path('u-bulk-upload-invoices-final-status/', views.u_bulk_upload_invoices_final_status, name='u-bulk-upload-invoices-final-status'),
    path('u-txn-invoices/<int:id>/', views.u_txn_invoices, name='u-txn-invoices'),
    path('v-txn-invoices/<int:id>/', views.v_txn_invoices, name='v-txn-invoices'),
    path('u-txn-invoices-status/', views.u_txn_invoices_status, name='u-txn-invoices-status'),

    # for job sheet
    path('r-txn-job-sheets/', views.r_txn_job_sheets, name='r-txn-job-sheets'),
    path('job-sheets-vehicletype/', views.job_sheets_vehicletype, name='job-sheets-vehicletype'),
    path('c-txn-job-sheets/<str:vehicletype>/', views.c_txn_job_sheets, name='c-txn-job-sheets'),
    path('d-txn-job-sheets/', views.d_txn_job_sheets, name='d-txn-job-sheets'),
    path('jobcards/<int:jobcard_id>/update-status/', views.update_jobcard_status, name='update-jobcard-status'),
    path('v-txn-job-sheets/<int:id>/', views.v_txn_job_sheets, name='v-txn-job-sheets'),      
    path('v-txn-job-sheets-invoice/<uuid:id>/', views.v_txn_job_sheets_invoice, name='v-txn-job-sheets-invoice'),  
    path('v-txn-job-sheets-customer/<uuid:id>/', views.v_txn_job_sheets_customer, name='v-txn-job-sheets-customer'),
    path('v-txn-job-sheets-mechanic/<uuid:id>/', views.v_txn_job_sheets_mechanic, name='v-txn-job-sheets-mechanic'),   
    path('u-txn-job-sheets/<int:id>/', views.u_txn_job_sheets, name='u-txn-job-sheets'),
    path("api/vehicles/<int:customer_id>/", views.get_customer_vehicles, name="get-customer-vehicles"),

    # for job card payments
    path('api/jobcard/payments/<int:jobcard_id>/', views.list_jobcard_payments, name='list_jobcard_payments'),
    path('api/jobcard/payment/save/', views.save_jobcard_payment, name='save_jobcard_payment'),
    path('api/jobcard/payment/update/<int:payment_id>/', views.update_jobcard_payment, name='update_jobcard_payment'),
    path('api/jobcard/payment/delete/<int:payment_id>/', views.delete_jobcard_payment, name='delete_jobcard_payment'),

    # for jobtype
    path('create-jobtype/', views.create_jobtype, name='create_jobtype'),
    path('list-jobtypes/', views.list_jobtypes, name='list_jobtypes'),

    # for service history
    path('api/service-history/', views.get_service_history, name='get_service_history'),

    # for customer
    path('list-customer-details/', views.list_customer_details, name='list-customer-details'),

    # for customer voice
    path('api/save/jobcard/customer-voice/', views.save_jobcard_customer_voice, name='save_jobcard_customer_voice'),
    path('get-jobcard-customer-voice/', views.get_jobcard_customer_voice, name='get_jobcard_customer_voice'),
    path('delete-jobcard-customer-voice/', views.delete_jobcard_customer_voice, name='delete_jobcard_customer_voice'),

    # for diagram image
    path('api/save/jobcard/mark_damage_img/', views.save_jobcard_mark_damage_img, name='save_jobcard_mark_damage_img'),

    # for vehicle issue
    path('list-vehicle-issues/', views.list_vehicle_issues, name='list_vehicle_issues'),
    path('save-vehicle-issue/', views.save_vehicle_issue, name='save_vehicle_issue'),

    # for vehicle damage
    path('list-vehicle-damages/', views.list_vehicle_damages, name='list_vehicle_damages'),
    path('save-vehicle-damage/', views.save_vehicle_damage, name='save_vehicle_damage'),

    # for vehicle accessory
    path('list-vehicle-accessories/', views.list_vehicle_accessories, name='list_vehicle_accessories'),
    path('save-vehicle-accessory/', views.save_vehicle_accessory, name='save_vehicle_accessory'),

    # for jobcard services
    path('api/save/jobcard/services/', views.save_jobcard_service, name='save_jobcard_service'),
    path('api/update/jobcard/services/', views.update_jobcard_service, name='update_jobcard_service'),
    path('get-jobcard-services/', views.get_jobcard_services, name='get_jobcard_services'),
    path('delete-jobcard-service/', views.delete_jobcard_service, name='delete_jobcard_service'),
    # for jobcard parts
    path('api/save/jobcard/parts/', views.save_jobcard_part, name='save_jobcard_part'),
    path('api/update/jobcard/parts/', views.update_jobcard_part, name='update_jobcard_part'),
    path('get-jobcard-parts/', views.get_jobcard_parts, name='get_jobcard_parts'),
    path('delete-jobcard-part/', views.delete_jobcard_part, name='delete_jobcard_part'),

    # for estimate
    path('r-txn-estimates/', views.r_txn_estimates, name='r-txn-estimates'),
    path('d-txn-estimates/', views.d_txn_estimates, name='d-txn-estimates'),
    path('c-txn-estimates/', views.c_txn_estimates, name='c-txn-estimates'),
    path('u-txn-estimates/<int:id>/', views.u_txn_estimates, name='u-txn-estimates'),
    path('v-txn-estimates/<int:id>/', views.v_txn_estimates, name='v-txn-estimates'),
    path('u-txn-estimates-status/', views.u_txn_estimates_status, name='u-txn-estimates-status'),

    # for services
    path('r-txn-services/', views.r_txn_services, name='r-txn-services'),
    path('d-txn-services/', views.d_txn_services, name='d-txn-services'),
    path('u-txn-services/<int:id>/', views.u_txn_services, name='u-txn-services'),

    # for payments
    path('r-txn-payments/', views.r_txn_payments, name='r-txn-payments'),

    # for daily reports
    path('r-txn-dailyreports/', views.r_txn_dailyreports, name='r-txn-dailyreports'),
    
    # CSV Export
    path('export-jobcards-csv/', views.export_jobcards_csv, name='export_jobcards_csv'),
]

inventory_urls = [  
    path('r-inventory/', views.r_inventory, name='r-inventory'), 
    path('get-models-by-brand/<int:brand_id>/', views.get_models_by_brand, name='get-models-by-brand'),

    path('r-inv-suppliers/', views.r_inv_suppliers, name='r-inv-suppliers'),  
    path('u-inv-suppliers/<int:id>/', views.u_inv_suppliers, name='u-inv-suppliers'),  
    path('d-inv-suppliers/', views.d_inv_suppliers, name='d-inv-suppliers'),

    path('r-inv-current-stock/', views.r_inv_current_stock, name='r-inv-current-stock'),  
    path('c-inv-current-stock/', views.c_inv_current_stock, name='c-inv-current-stock'),
    path('u-inv-current-stock/<int:id>/', views.u_inv_current_stock, name='u-inv-current-stock'),  
    path('d-inv-current-stock/', views.d_inv_current_stock, name='d-inv-current-stock'),
    path('g-inv-current-stock/<int:product_id>/', views.g_inv_current_stock, name='g-inv-current-stock'),
    path('bulk-upload-current-stock/', views.bulk_upload_current_stock, name='bulk-upload-current-stock'),
    
    path('r-inv-stock-inward/', views.r_inv_stock_inward, name='r-inv-stock-inward'),  
    path('u-inv-stock-inward/<int:id>/', views.u_inv_stock_inward, name='u-inv-stock-inward'),  
    path('d-inv-stock-inward/', views.d_inv_stock_inward, name='d-inv-stock-inward'),
    path('bulk-upload-stock-inward/', views.bulk_upload_stock_inward, name='bulk-upload-stock-inward'),

    path('r-inv-stock-outward/', views.r_inv_stock_outward, name='r-inv-stock-outward'),  
    path('u-inv-stock-outward/<int:id>/', views.u_inv_stock_outward, name='u-inv-stock-outward'),  
    path('d-inv-stock-outward/', views.d_inv_stock_outward, name='d-inv-stock-outward'),
    path('bulk-upload-stock-outward/', views.bulk_upload_stock_outward, name='bulk-upload-stock-outward'),

    path('r-inv-categories/', views.r_inv_categories, name='r-inv-categories'),
    path('u-inv-categories/<int:id>/', views.u_inv_categories, name='u-inv-categories'),
    path('d-inv-categories/', views.d_inv_categories, name='d-inv-categories'),

    path('r-inv-brands/', views.r_inv_brands, name='r-inv-brands'),
    path('u-inv-brands/<int:id>/', views.u_inv_brands, name='u-inv-brands'),
    path('d-inv-brands/', views.d_inv_brands, name='d-inv-brands'),

    path('r-inv-model/', views.r_inv_model, name='r-inv-model'),
    path('c-inv-model/', views.c_inv_model, name='c-inv-model'),
    path('u-inv-model/<int:id>/', views.u_inv_model, name='u-inv-model'),
    path('d-inv-model/', views.d_inv_model, name='d-inv-model'),

    path('g-inv-service/<int:service_id>/', views.g_inv_service, name='g-inv-service'),
    
    # CSV Export URLs
    path('export-product-catalogues-csv/', views.export_product_catalogues_csv, name='export-product-catalogues-csv'),
    path('export-stock-inwards-csv/', views.export_stock_inwards_csv, name='export-stock-inwards-csv'),
    path('export-stock-outwards-csv/', views.export_stock_outwards_csv, name='export-stock-outwards-csv'),
] 

profile_urls = [
    path('r-prf-summary/', views.r_prf_summary, name='r-prf-summary'),
    # for customer
    path('r-prf-customers/', views.r_prf_customers, name='r-prf-customers'),
    path('u-prf-customers/<int:id>/', views.u_prf_customers, name='u-prf-customers'),
    path('d-prf-customers/', views.d_prf_customers, name='d-prf-customers'),    
    path('c-prf-customers/', views.c_prf_customers, name='c-prf-customers'),       
    path('s-prf-customers-vehicles/', views.s_prf_customers_vehicles, name='s-prf-customers-vehicles'),
    
    path("api/update-customer-details/", views.update_customer_details, name="update-customer-details"), 
    path("api/update-vehicle-details/", views.update_vehicle_details, name="update-vehicle-details"), 

    # for vehicle - customer specific vehicle operations
    path('c-prf-vehicles/<int:id>/', views.c_prf_vehicles, name='c-prf-vehicles'),
    path('u-prf-vehicles/<int:id>/', views.u_prf_vehicles, name='u-prf-vehicles'),
    path('d-prf-vehicles/<int:id>/', views.d_prf_vehicles, name='d-prf-vehicles'),
    
    # for vehicle - general vehicle management
    path('r-prf-vehicles/', views.r_vehicles, name='r-prf-vehicles'),
    # path('c-prf-vehicles/', views.c_vehicles, name='c-prf-vehicles'),
    # path('v-prf-vehicles/<int:id>/', views.v_vehicles, name='v-prf-vehicles'),
    # path('u-prf-vehicles/<int:id>/', views.u_vehicles, name='u-prf-vehicles'),
    path('d-prf-vehicles/', views.d_vehicles, name='d-prf-vehicles'),
    path('u-prf-customers_all/<int:id>/', views.u_prf_customers_all, name='u-prf-customers_all'),
]

accounts_urls = [
    path('r-garage-summary/', views.r_garage_summary, name = 'r-garage-summary'),    
    # path('c-garage-summary/<int:id>/', views.c_garage_summary, name='c-garage-summary'),    
    path('u-garage-summary/', views.u_garage_summary, name='u-garage-summary'),    

    path('u-users-accesses-garage-id/', views.u_users_accesses_garage_id, name='u-users-accesses-garage-id'),
    path('r-accounts-garage/', views.r_accounts_garage, name='r-accounts-garage'),
    path('c-accounts-garage/', views.c_accounts_garage, name='c-accounts-garage'),
    path('u-accounts-garage/<int:id>/', views.u_accounts_garage, name='u-accounts-garage'),
    path('v-accounts-garage/<int:id>/', views.v_accounts_garage, name='v-accounts-garage'),
    path('u-accounts-garage-business-hours/<int:id>/', views.u_accounts_garage_business_hours, name='u-accounts-garage-business-hours'),
    path('d-accounts-garage/', views.d_accounts_garage, name = 'd-accounts-garage'),
    path('r-accounts-garage-service/<int:id>/', views.r_accounts_garage_service, name='r-accounts-garage-service'),
    path('c-accounts-garage-service/<int:id>/', views.c_accounts_garage_service, name='c-accounts-garage-service'),
    path('u-accounts-garage-service/<int:id>/', views.u_accounts_garage_service, name='u-accounts-garage-service'),
    path('d-accounts-garage-service/', views.d_accounts_garage_service, name = 'd-accounts-garage-service'),
    path('r-accounts-garage-banner/<int:id>/', views.r_accounts_garage_banner, name='r-accounts-garage-banner'),
    path('c-accounts-garage-banner/<int:id>/', views.c_accounts_garage_banner, name='c-accounts-garage-banner'),
    path('u-accounts-garage-banner/<int:id>/', views.u_accounts_garage_banner, name='u-accounts-garage-banner'),
    path('d-accounts-garage-banner/', views.d_accounts_garage_banner, name = 'd-accounts-garage-banner'),
    
    path('r-accounts-garagegroup/', views.r_accounts_garagegroup, name='r-accounts-garagegroup'),    
    path('c-accounts-garagegroup', views.c_accounts_garagegroup, name='c-accounts-garagegroup'),
    path('u-accounts-garagegroup/<int:id>/', views.u_accounts_garagegroup, name='u-accounts-garagegroup'),
    path('u-accounts-garagegroup-mapping/<int:id>/', views.u_accounts_garagegroup_mapping, name='u-accounts-garagegroup-mapping'),
    path('d-accounts-garagegroup/', views.d_accounts_garagegroup, name = 'd-accounts-garagegroup'),

    path('r-accounts-bookings/', views.r_accounts_bookings, name='r-accounts-bookings'),
    path('v-accounts-bookings/<int:id>/', views.v_accounts_bookings, name='v-accounts-bookings'),
    path('u-accounts-bookings/<int:id>/', views.u_accounts_bookings, name='u-accounts-bookings'),
    path('d-accounts-bookings/', views.d_accounts_bookings, name = 'd-accounts-bookings'),
    path('c-accounts-bookings-jobcard/', views.create_booking_jobcard, name='c-accounts-bookings-jobcard'),

    path('r-accounts-servicetype/', views.r_accounts_servicetype, name='r-accounts-servicetype'),
    path('c-accounts-servicetype/', views.c_accounts_servicetype, name='c-accounts-servicetype'),
    path('u-accounts-servicetype/<int:id>/', views.u_accounts_servicetype, name='u-accounts-servicetype'),
    path('d-accounts-servicetype/', views.d_accounts_servicetype, name='d-accounts-servicetype'),

    path('r-accounts-service/', views.r_accounts_service, name='r-accounts-service'),
    path('c-accounts-service/', views.c_accounts_service, name='c-accounts-service'),
    path('u-accounts-service/<int:id>/', views.u_accounts_service, name='u-accounts-service'),
    path('d-accounts-service/', views.d_accounts_service, name='d-accounts-service'),

    path('r-accounts-servicecategory/', views.r_accounts_servicecategory, name='r-accounts-servicecategory'),    
    path('c-accounts-servicecategory/', views.c_accounts_servicecategory, name='c-accounts-servicecategory'),
    path('u-accounts-servicecategory/<int:id>/', views.u_accounts_servicecategory, name='u-accounts-servicecategory'),
    path('d-accounts-servicecategory/', views.d_accounts_servicecategory, name = 'd-accounts-servicecategory'),

    path('r-city/', views.r_accounts_city, name='r-accounts-city'),    
    path('c-city/', views.c_accounts_city, name='c-accounts-city'),
    path('u-city/<int:id>/', views.u_accounts_city, name='u-accounts-city'),
    path('d-city/', views.d_accounts_city, name = 'd-accounts-city'),

    path('r-accounts-brand/', views.r_accounts_brand, name='r-accounts-brand'),    
    path('c-accounts-brand/', views.c_accounts_brand, name='c-accounts-brand'),
    path('u-accounts-brand/<int:id>/', views.u_accounts_brand, name='u-accounts-brand'),
    path('d-accounts-brand/', views.d_accounts_brand, name = 'd-accounts-brand'),

    path('r-accounts-cc/', views.r_accounts_cc, name='r-accounts-cc'),    
    path('c-accounts-cc/', views.c_accounts_cc, name='c-accounts-cc'),
    path('u-accounts-cc/<int:id>/', views.u_accounts_cc, name='u-accounts-cc'),
    path('d-accounts-cc/', views.d_accounts_cc, name = 'd-accounts-cc'),

    path('r-accounts-model/', views.r_accounts_model, name='r-accounts-model'),    
    path('c-accounts-model/', views.c_accounts_model, name='c-accounts-model'),
    path('u-accounts-model/<int:id>/', views.u_accounts_model, name='u-accounts-model'),
    path('d-accounts-model/', views.d_accounts_model, name = 'd-accounts-model'),

    path('r-accounts-accessories/', views.r_accounts_accessories, name='r-accounts-accessories'),    
    path('c-accounts-accessories/', views.c_accounts_accessories, name='c-accounts-accessories'),
    path('u-accounts-accessories/<int:id>/', views.u_accounts_accessories, name='u-accounts-accessories'),
    path('d-accounts-accessories/', views.d_accounts_accessories, name = 'd-accounts-accessories'),

    path('r-accounts-banner/', views.r_accounts_banner, name='r-accounts-banner'),    
    path('c-accounts-banner/', views.c_accounts_banner, name='c-accounts-banner'),
    path('u-accounts-banner/<int:id>/', views.u_accounts_banner, name='u-accounts-banner'),
    path('d-accounts-banner/', views.d_accounts_banner, name = 'd-accounts-banner'),
]

# Staff URLs
staff_urls = [
    path('r-staff/', views.r_staff, name='r-staff'),
    path('c-staff/', views.c_staff, name='c-staff'),
    path('u-staff/<int:id>/', views.u_staff, name='u-staff'),
    path('d-staff/', views.d_staff, name='d-staff'),
    path('api/list-staff/', views.list_staff, name='list_staff'),    
    path('api/create-staff/', views.create_staff, name='create_staff'),
]

# API URLs
api_urls = [
    path('api/send-sms/', SendSMSAPI.as_view(), name='api-send-sms'),
    path('api/verify-otp/', VerifyOTPAPI.as_view(), name='api-verify-otp'),
    path('api/active-cities/', ActiveCityListAPIView.as_view(), name='api-active-cities'),
    path('api/listgarage/', ListGarageAPIView.as_view(), name='api-listgarage'),
    path('api/garage/', GarageDetailAPIView.as_view(), name='api-garage-detail'),
    path('api/garage/services/', GarageServiceListAPIView.as_view(), name='api-garage-services'),
    path('api/accessories/', AccessoryListAPIView.as_view(), name='api-accessories-list'),
    path('api/brands/', BrandListAPIView.as_view(), name='api-brands-list'),
    path('api/models/', ModelListAPIView.as_view(), name='api-models-list'),
    path('api/subscriber/vehicle/', SubscriberVehicleAPI.as_view(), name='api-subscriber-vehicle'),
    path('api/subscriber/vehicle/<int:id>/', SubscriberVehicleAPI.as_view(), name='api-subscriber-vehicle-detail'),
    path('api/subscriber/vehicles/', ListSubscriberVehicleAPI.as_view(), name='api-subscriber-vehicles'),
    path('api/subscriber/address/', SubscriberAddressAPI.as_view(), name='api-subscriber-address'),
    path('api/subscriber/address/<int:id>/', SubscriberAddressAPI.as_view(), name='api-subscriber-address-detail'),
    path('api/subscriber/addresses/', ListSubscriberAddressAPI.as_view(), name='api-subscriber-addresses'),
    path('api/subscriber/booking/', SubscriberBookingAPI.as_view(), name='api-subscriber-booking'),
    path('api/subscriber/booking/update_status/', BookingStatusUpdateView.as_view(), name='api-subscriber-booking-update-status'),
    path('api/subscriber/booking-review/', SubscriberBookingReviewAPIView.as_view(), name='api-subscriber-booking-review'),
    path('api/subscriber/profile/', SubscriberProfileAPIView.as_view(), name='api-subscriber-profile'),
    # Date Range Session Management
    path('api/set-date-range/', views.set_date_range, name='api-set-date-range'),
]

well_known_urls = [
    path('.well-known/appspecific/com.chrome.devtools.json', TemplateView.as_view(template_name=".well-known/appspecific/com.chrome.devtools.json")),
]

urlpatterns = [
    path('', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('reset-password/', views.reset_password, name='reset-password'),
    path('r-home/', views.r_home, name='r-home'),
] + api_urls + auditlog_urls + roles_urls + users_urls + transactions_urls + inventory_urls + profile_urls + accounts_urls + staff_urls + well_known_urls