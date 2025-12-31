import json
import os
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.utils import timezone

# Create your models here.

class Subscriber(models.Model):
    phone = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.subscribervehicle, "subscriber vehicle"),
            (self.subscriberaddress, "subscriber address"),
            (self.subscriberbooking, "subscriber booking"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )          
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "subscriber"
        ordering = ['-created_at']


class SendOtp(models.Model):
    phone = models.CharField(max_length=20)
    otp = models.CharField(max_length=6, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sendotp"
        ordering = ['-created_at']


class VehicleType(models.Model):
    name = models.CharField(max_length=255)
    is_ev = models.BooleanField(default=False)
    wheeler = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        related_objects = [
            (self.rel_garage_vehicletype, "rel garage vehicletype"),
        ]
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "vehicle_type"
        ordering = ['-created_at']


class City(models.Model):        
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]  
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.garage, "garage"),
            (self.banner, "banner"),   
            (self.rel_city_user, "rel city user"),  
            (self.rel_city_servicecategory, "rel city servicecategory"),  
            (self.subscriberaddress, "subscriber address"),   
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )          
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "city"
        ordering = ['-created_at']


class Garage(models.Model):   
    city = models.ForeignKey('City', on_delete=models.CASCADE, related_name="garage")
    external_garageid = models.CharField(max_length=255,blank=True, null=True)
    # Garage Identity
    name = models.CharField(max_length=255, unique=True)
    logo = models.CharField(max_length=255, blank=True, null=True)
    tagline = models.CharField(max_length=255, blank=True, null=True)
    year_established = models.PositiveIntegerField(
        validators=[MinValueValidator(1900), MaxValueValidator(2025)],
        null=True,
        blank=True
    )
    rating = models.DecimalField(
        max_digits=3,  # 3 digits in total (1 before decimal, 1 after)
        decimal_places=1,
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        help_text='Garage rating from 0.0 to 5.0'
    )
    # Contact Information
    contact_person = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    alt_phone = models.CharField(max_length=20, blank=True, null=True)
    # Address fields
    address = models.TextField()
    radius = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        validators=[MinValueValidator(0.01, message='Radius must be greater than 0')],
        help_text='Service radius in kilometers'
    )
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    landmark = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=10)
    # Additional Information    
    is_exclusive = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_offer = models.BooleanField(default=False)
    offer_text = models.TextField(blank=True, null=True)
    about = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)    
    gst = models.CharField(max_length=15, blank=True, null=True, validators=[
        RegexValidator(
            regex='^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
            message='Enter a valid GST number (e.g., 22AAAAA0000A1Z5)'
        )
    ])
    pan = models.CharField(max_length=10, blank=True, null=True, validators=[
        RegexValidator(
            regex='^[A-Z]{5}[0-9]{4}[A-Z]{1}$',
            message='Enter a valid PAN number (e.g., ABCDE1234F)'
        )
    ])
    aadhar = models.CharField(max_length=12, blank=True, null=True, validators=[
        RegexValidator(
            regex='^[2-9]{1}[0-9]{11}$',
            message='Enter a valid 12-digit Aadhar number'
        )
    ])
    terms_and_conditions = models.TextField(help_text="Terms and conditions to be displayed on invoices")  
    # Location coordinates
    latitude = models.DecimalField(
        max_digits=10, 
        decimal_places=8, 
        null=True, 
        blank=True,
        validators=[
            MinValueValidator(Decimal('-90.0')),
            MaxValueValidator(Decimal('90.0'))
        ]
    )
    longitude = models.DecimalField(
        max_digits=11, 
        decimal_places=8, 
        null=True, 
        blank=True,
        validators=[
            MinValueValidator(Decimal('-180.0')),
            MaxValueValidator(Decimal('180.0'))
        ]
    )
    
    authorized_signatory = models.CharField(max_length=255, blank=True, null=True)
    displayed = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.rel_garage_garagegroup, "rel garage garagegroup"),
            (self.partner, "partner"),
            (self.booking, "booking"),
            (self.customer, "customer"),
            (self.vehicle, "vehicle"),
            (self.txn_service, "txn service"),
            (self.invoices, "invoices"),
            (self.estimates, "estimates"),
            # (self.rel_garage_txn_service, "rel garage txn service"),
            (self.rel_garage_user, "rel garage user"),
            (self.product_catalogues, "product catalogues"),
            (self.stock_inwards, "stock inwards"),
            (self.stock_outwards, "stock outwards"),
            (self.inventory_supplier, "inventory supplier"),
            (self.inventory_categories, "inventory categories"),
            (self.inventory_brands, "inventory brands"),    
            (self.rel_garage_servicecategory, "rel garage servicecategory"),  
            (self.rel_garage_service, "rel garage service"), 
            (self.garage_banner, "garage banner"),     
            (self.subscriberbooking, "subscriber booking"),
            (self.invoice_bulk_uploads, "invoice bulk uploads"),
            (self.vehicle_common_issues, "vehicle common issues"),
            (self.vehicle_accessories, "vehicle accessories"),
            (self.service_checklist, "service checklist"),
            (self.jobcard_brands, "service checklist"),
            (self.jobcard_models, "jobcard models"),            
            (self.jobcard, "jobcard"),
            (self.jobtype, "jobtype"),
            (self.garage_vehicle_issue, "garage vehicle issue"),            
            (self.jobcard_vehicle_damage, "jobcard vehicle damage"),
            (self.jobcard_vehicle_accessory, "jobcard vehicle accessory"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )   
        """Delete associated images when the record is deleted."""
        image_fields = ["logo", "authorized_signatory"]
        for field in image_fields:
            image_path = getattr(self, field, None)
            if image_path:
                full_path = os.path.join(settings.BASE_DIR, image_path)
                if os.path.isfile(full_path):
                    os.remove(full_path)        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "garage"
        ordering = ["-created_at"]


class RelGarageVehicleType(models.Model):
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="rel_garage_vehicletype")
    vehicletype = models.ForeignKey('VehicleType', on_delete=models.CASCADE, related_name="rel_garage_vehicletype")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_garage_vehicletype"
        unique_together = ('garage', 'vehicletype')
        ordering = ['-created_at']


class GarageStaff(models.Model):
    ROLE_CHOICES = [
        ('crew', 'Crew'),
        ('mechanic', 'Mechanic'),
        ('supervisor', 'Supervisor'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name='garage_staff')
    firstname = models.CharField(max_length=100)
    middlename = models.CharField(max_length=100, blank=True, null=True)
    lastname = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    aadhar = models.CharField(max_length=20)
    attachment = models.CharField(max_length=255,blank=True, null=True)
    role = models.JSONField(help_text="List of roles, e.g. ['crew'] or ['mechanic'] or ['crew', 'mechanic']")
    reference_by_name = models.CharField(max_length=255)
    reference_by_phone = models.CharField(max_length=15)
    reference_by_email = models.EmailField(blank=True, null=True)
    year_of_experience = models.PositiveIntegerField()
    past_experience = models.TextField(blank=True, null=True) 
    specialization = models.TextField(blank=True, null=True) 
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    availability = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def roles(self):
        """Ensure role is always returned as a list"""
        if not self.role:
            return []
        if isinstance(self.role, str):
            try:
                return json.loads(self.role)
            except (TypeError, json.JSONDecodeError):
                return [self.role]
        return self.role

    def delete(self, *args, **kwargs):        
        """Delete associated images and check for timeline references before deletion."""
        from django.db.models import Q
        
        # Check if this staff member is referenced in any BookingTimeline remark
        from GMSApp.models import BookingTimeline
        
        # Check if staff ID exists in any BookingTimeline remark
        referenced_in_timeline = BookingTimeline.objects.filter(
            Q(remark__contains=str(self.id))
        ).exists()
        
        if referenced_in_timeline:
            raise ValidationError(
                f"Cannot delete {self.firstname} {self.lastname} (ID: {self.id}) because they are referenced in booking timeline records."
            )
        
        # List of related objects to check
        related_objects = [
            (self.jobcard, "jobcard"),
            (self.jobcard_garage_staff, "jobcard garage staff"),
            (self.jobcard_mechanic, "jobcard mechanic"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )
            
        # Delete associated images
        image_fields = ["attachment"]
        for field in image_fields:
            image_path = getattr(self, field, None)
            if image_path:
                full_path = os.path.join(settings.BASE_DIR, image_path)
                if os.path.isfile(full_path):
                    os.remove(full_path)        
        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    @classmethod
    def get_active_and_available_crew_for_garage(cls, garage_id):
        """
        Get all active and available crew members for a specific garage.
        
        Args:
            garage_id (int): The ID of the garage to filter crew by
                        
        Returns:
            list: List of GarageStaff objects with 'crew' role
                
        Example:
            # Get all available crew members for garage with ID 1
            crew = GarageStaff.get_active_and_available_crew_for_garage(garage_id=1)
        """
        staff_queryset = cls.objects.filter(
            garage_id=garage_id,
            status='active',
            availability=True
        )
        
        return [staff for staff in staff_queryset if 'crew' in staff.roles]

    @classmethod
    def get_active_and_available_mechanic_for_garage(cls, garage_id):
        """
        Get all active and available mechanic for a specific garage.
        
        Args:
            garage_id (int): The ID of the garage to filter mechanic by
                        
        Returns:
            list: List of GarageStaff objects with 'mechanic' role
                
        Example:
            # Get all available mechanic for garage with ID 1
            mechanic = GarageStaff.get_active_and_available_mechanic_for_garage(garage_id=1)
        """
        staff_queryset = cls.objects.filter(
            garage_id=garage_id,
            status='active',
            availability=True
        )
        
        return [staff for staff in staff_queryset if 'mechanic' in staff.roles]
    
    class Meta:
        db_table = "garage_staff"
        unique_together=("phone", "garage")
        ordering = ["-created_at"]


class GarageBusinessHours(models.Model):
    DAYS_OF_WEEK = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name='garage_business_hours')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    open_time = models.TimeField(null=True, blank=True)
    close_time = models.TimeField(null=True, blank=True)
    is_closed = models.BooleanField(default=False, help_text="Check if garage is closed on this day")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:        
        db_table = "garage_business_hours"
        unique_together = ('garage', 'day_of_week')
        ordering = ['garage', 'day_of_week']
        
        
class GarageGroup(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [            
            (self.rel_garage_garagegroup, "rel garage garagegroup"),    
            (self.users, "users"),         
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )       
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "garagegroup"
        ordering = ["-created_at"]


class RelGarageGarageGroup(models.Model):
    garage = models.ForeignKey('Garage',on_delete=models.CASCADE,related_name='rel_garage_garagegroup')
    garagegroup = models.ForeignKey('GarageGroup',on_delete=models.CASCADE,related_name='rel_garage_garagegroup')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_garage_garagegroup"
        unique_together=("garage", "garagegroup")
        ordering = ["-created_at"]

        
class Customer(models.Model):
    garage = models.ForeignKey('Garage',on_delete=models.CASCADE,related_name='customer',blank=True, null=True)
    name = models.CharField(max_length=255)
    gst = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)     
    email = models.EmailField(max_length=200, blank=True, null=True)
    phone = models.CharField(max_length=10)
    alt_phone = models.CharField(max_length=10, blank=True, null=True)
    pincode = models.CharField(max_length=6, blank=True, null=True)
    comments = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.vehicle, "vehicle"),
            (self.invoices, "invoices"),
            (self.estimates, "estimates"),
            (self.invoice_bulk_upload_txn, "invoice bulk upload txn"),
            (self.jobcard, "jobcard"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:        
        unique_together = ('garage', 'phone')
        db_table = "customer"


class JobcardBrands(models.Model):    
    VEHICLE_TYPE_CHOICES = [
        ('2', '2 Wheeler'),
        ('3', '3 Wheeler'),
        ('4', '4 Wheeler'),
        ('6', '6 Wheeler'),
    ]
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="jobcard_brands")
    name = models.CharField(max_length=255)
    displayname = models.CharField(max_length=255)
    vehicletype = models.CharField(max_length=100, choices=VEHICLE_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.jobcard_models, "jobcard models"), 
            (self.vehicle, "vehicle"),        
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            ) 
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        unique_together = ('garage', 'name', 'vehicletype')
        db_table = "jobcard_brands" 
        ordering = ['-created_at']    


class JobcardModels(models.Model):    
    VEHICLE_TYPE_CHOICES = [
        ('2', '2 Wheeler'),
        ('3', '3 Wheeler'),
        ('4', '4 Wheeler'),
        ('6', '6 Wheeler'),
    ]
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="jobcard_models")
    jobcardbrand = models.ForeignKey('JobcardBrands', on_delete=models.CASCADE, related_name="jobcard_models")
    name = models.CharField(max_length=255)
    displayname = models.CharField(max_length=255)
    vehicletype = models.CharField(max_length=100, choices=VEHICLE_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.vehicle, "vehicle"),        
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            ) 
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        unique_together = ('garage', 'jobcardbrand', 'name', 'vehicletype')
        db_table = "jobcard_models" 
        ordering = ['-created_at'] 

      
class Vehicle(models.Model):
    current_year = datetime.now().year
    VEHICLE_TYPE_CHOICES = [
        ('2', '2 Wheeler'),
        ('3', '3 Wheeler'),
        ('4', '4 Wheeler'),
        ('6', '6 Wheeler'),
    ]
    customer = models.ForeignKey('Customer',on_delete=models.CASCADE,related_name='vehicle')
    garage = models.ForeignKey('Garage',on_delete=models.CASCADE,related_name='vehicle',blank=True, null=True)
    jobcardbrand = models.ForeignKey('JobcardBrands',on_delete=models.CASCADE,related_name='vehicle',blank=True, null=True)
    jobcardmodel = models.ForeignKey('JobcardModels',on_delete=models.CASCADE,related_name='vehicle',blank=True, null=True)
    vehicletype = models.CharField(max_length=100, choices=VEHICLE_TYPE_CHOICES, default='2')
    model = models.CharField(max_length=255) 
    make = models.CharField(max_length=255, blank=True, null=True) 
    license_plate_no = models.CharField(max_length=100, blank=True, null=True)
    external_bikeid = models.CharField(max_length=300, blank=True, null=True)
    registration_no = models.CharField(max_length=100, blank=True, null=True)
    year_of_manufacture = models.CharField(max_length=50, blank=True, null=True)
    fuel_type = models.CharField(max_length=50, blank=True, null=True)
    transmission_type = models.CharField(max_length=50, blank=True, null=True)
    engine_no = models.CharField(max_length=100, blank=True, null=True)
    chassis_no = models.CharField(max_length=100, blank=True, null=True)
    vin_no = models.CharField(max_length=100, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    reg_state = models.CharField(max_length=100, blank=True, null=True)
    reg_exp = models.DateField(blank=True, null=True)
    image_path = models.CharField(max_length=255, blank=True, null=True)
    dailyrunning = models.FloatField(default=0)
    odometerreading = models.FloatField(default=0)
    vehiclemileage = models.FloatField(default=0)
    vehicleage = models.FloatField(default=0) 
    fuelpercentage = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.invoices, "invoices"),
            (self.estimates, "estimates"),
            (self.invoice_bulk_upload_txn, "invoice bulk upload txn"),
            (self.jobcard, "jobcard"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )        
            
        """Delete image when record is deleted."""
        if self.image_path:
            img_path = os.path.join(settings.BASE_DIR, self.image_path)
            if os.path.isfile(img_path):
                os.remove(img_path)
        # Proceed with deletion if no associations exist        
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "vehicle"


class Invoice(models.Model):    
    garage = models.ForeignKey('Garage',on_delete=models.CASCADE,related_name='invoices', blank=True, null=True)
    invoiceid = models.CharField(max_length=100, unique=True)
    invoicedate = models.DateField()
    pono = models.CharField(max_length=100, blank=True, null=True)
    podate = models.DateField(blank=True, null=True)
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='invoices')
    name = models.CharField(max_length=255)
    vehicle = models.ForeignKey('Vehicle', on_delete=models.CASCADE, related_name='invoices')
    status = models.CharField(max_length=50, default='created')
    amount = models.FloatField(default=0.0)
    comments = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.invoiceid:
            today = timezone.now().date()
            # Get financial year in format 25-26
            financial_year = f"{str(today.year)[2:]}-{str(today.year + 1)[2:]}"
            
            # Get the latest invoice for this garage in this financial year
            last_invoice = Invoice.objects.filter(
                garage=self.garage,
                invoicedate__year=today.year
            ).order_by('id').last()

            if last_invoice and last_invoice.invoiceid:
                try:
                    # Split the invoice ID by '/' and get the second-to-last part (incremental number)
                    parts = last_invoice.invoiceid.split('/')
                    if len(parts) >= 2:
                        last_increment = int(parts[-2])  # Get the second-to-last part
                        next_increment = last_increment + 1
                    else:
                        raise ValueError("Invalid invoice ID format")
                except (ValueError, IndexError):
                    # If any error occurs, start with 1
                    next_increment = 1
            else:
                next_increment = 1

            # Format: garage_id/incremental_number/financial_year
            if self.garage:
                self.invoiceid = f"{self.garage.id}/{next_increment}/{financial_year}"
            else:
                self.invoiceid = f"0/{next_increment}/{financial_year}"
        
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.invoice_product_catalogues, "invoice product catalogues"),
            (self.invoice_services, "invoice services"),
            (self.jobcard, "jobcard"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            ) 
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "invoice"
        ordering = ['-created_at']


class TrackInvoiceUploads(models.Model):
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name='invoice_bulk_uploads')
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=255, blank=True, null=True)
    success_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    total_count = models.IntegerField(default=0, help_text="Total number of records (success + failed)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.invoice_bulk_upload_txn, "invoice bulk upload txn"),
            (self.bulk_upload_invoices, "bulk upload invoices"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            ) 
        # Remove the file if it exists
        if self.file_path:
            file_path = os.path.join(settings.BASE_DIR, self.file_path)
            if os.path.isfile(file_path):
                os.remove(file_path)    
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "invoice_bulk_uploads"        
        unique_together = ('garage', 'file_name')
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        self.total_count = self.success_count + self.failed_count
        super().save(*args, **kwargs)


class InvoiceBulkUploadTXN(models.Model):
    invoice_id = models.CharField(max_length=100, unique=True)
    track_invoice_uploads = models.ForeignKey('TrackInvoiceUploads', on_delete=models.CASCADE, related_name='invoice_bulk_upload_txn')
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='invoice_bulk_upload_txn')
    vehicle = models.ForeignKey('Vehicle', on_delete=models.CASCADE, related_name='invoice_bulk_upload_txn')
    status = models.TextField(default='pending')
    final_status = models.TextField(default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "invoice_bulk_upload_txn"
        ordering = ['-created_at']


# class BulkUploadInvoices(models.Model):
#     track_invoice_uploads = models.ForeignKey('TrackInvoiceUploads', on_delete=models.CASCADE, related_name='bulk_upload_invoices', null=True, blank=True)
#     # for invoice
#     invoice_id = models.CharField(max_length=100, unique=True)
#     invoice_date = models.DateField()
#     invoice_pono = models.CharField(max_length=100, blank=True, null=True)
#     invoice_podate = models.DateField(blank=True, null=True)

#     # for customer
#     customer_phone = models.CharField(max_length=10)
#     customer_name = models.CharField(max_length=255)
#     customer_gst = models.CharField(max_length=255, blank=True, null=True)
#     customer_address = models.TextField(blank=True, null=True)     
#     customer_email = models.EmailField(max_length=200, blank=True, null=True)
#     customer_pincode = models.CharField(max_length=6, blank=True, null=True)

#     # for vehicle
#     vehicle_model = models.CharField(max_length=255) 
#     vehicle_make = models.CharField(max_length=255, blank=True, null=True) 
#     vehicle_license_plate_no = models.CharField(max_length=100, blank=True, null=True)
#     vehicle_external_bikeid = models.CharField(max_length=300, blank=True, null=True)
#     vehicle_registration_no = models.CharField(max_length=100, blank=True, null=True)
#     vehicle_year_of_manufacture = models.DateField(blank=True, null=True)
#     vehicle_fuel_type = models.CharField(max_length=50, blank=True, null=True)
#     vehicle_transmission_type = models.CharField(max_length=50, blank=True, null=True)
#     vehicle_engine_no = models.CharField(max_length=100, blank=True, null=True)
#     vehicle_chassis_no = models.CharField(max_length=100, blank=True, null=True)
#     vehicle_vin_no = models.CharField(max_length=100, blank=True, null=True)
#     vehicle_color = models.CharField(max_length=50, blank=True, null=True)
#     vehicle_reg_state = models.CharField(max_length=100, blank=True, null=True)
#     vehicle_reg_exp = models.DateField(blank=True, null=True)
#     status = models.TextField(default='pending')
#     final_status = models.TextField(default='pending')

#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def delete(self, *args, **kwargs):
#         # List of related objects to check
#         related_objects = [
#             (self.bulkuploadinvoiceservices, "bulk upload invoice services"),
#             (self.bulkuploadinvoiceparts, "bulk upload invoice parts"),
#         ]
#         # Check if any related object exists and identify the associations
#         associations = [
#             description for obj, description in related_objects if obj.exists()
#         ]
#         if associations:
#             raise ValidationError(
#                 f"Deletion Failed: Associated with {', '.join(associations)}."
#             )          
#         # Proceed with deletion if no associations exist
#         super().delete(*args, **kwargs) 

#     class Meta:
#         db_table = "bulkuploadinvoices"
#         ordering = ['-created_at']


# class BulkUploadInvoiceServices(models.Model):
#     SERVICE_SOURCE_CHOICES = (
#         ('service', 'Service'),
#         ('external', 'External'),
#     )
#     invoice = models.ForeignKey('BulkUploadInvoices', on_delete=models.CASCADE, related_name='bulkuploadinvoiceservices')
#     service_source = models.CharField(max_length=20, choices=SERVICE_SOURCE_CHOICES)
#     service_name = models.CharField(max_length=255)
#     quantity = models.PositiveIntegerField(default=1)
#     service_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
#     service_tax = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
#     service_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
#     status = models.TextField(default='pending')

#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = "bulkuploadinvoiceservices"
#         ordering = ['-created_at']


# class BulkUploadInvoiceParts(models.Model):
#     PART_SOURCE_CHOICES = [
#         ('inventory', 'Inventory'),
#         ('external', 'External'),
#     ]

#     invoice = models.ForeignKey('BulkUploadInvoices', on_delete=models.CASCADE, related_name='bulkuploadinvoiceparts')
#     part_source = models.CharField(max_length=20, choices=PART_SOURCE_CHOICES)
#     part_name = models.CharField(max_length=255)
#     quantity = models.PositiveIntegerField(default=1)
#     part_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
#     part_tax = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
#     part_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
#     status = models.TextField(default='pending')

#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = "bulkuploadinvoiceparts"
#         ordering = ['-created_at']


class Estimate(models.Model):
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name='estimates', blank=True, null=True)
    estimateid = models.CharField(max_length=100, unique=True)
    estimatedate = models.DateField()
    pono = models.CharField(max_length=100, blank=True, null=True)
    podate = models.DateField(blank=True, null=True)
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='estimates')
    name = models.CharField(max_length=255)
    vehicle = models.ForeignKey('Vehicle', on_delete=models.CASCADE, related_name='estimates')
    status = models.CharField(max_length=50, default='created')
    amount = models.FloatField(default=0.0)    
    comments = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.estimateid:
            today = timezone.now().date()
            # Get financial year in format 25-26
            financial_year = f"{str(today.year)[2:]}-{str(today.year + 1)[2:]}"
            
            # Get the latest estimate for this garage in this financial year
            last_estimate = Estimate.objects.filter(
                garage=self.garage,
                estimatedate__year=today.year
            ).order_by('id').last()

            if last_estimate and last_estimate.estimateid:
                try:
                    # Split the estimate ID by '/' and get the second-to-last part (incremental number)
                    parts = last_estimate.estimateid.split('/')
                    if len(parts) >= 2:
                        last_increment = int(parts[-2])  # Get the second-to-last part
                        next_increment = last_increment + 1
                    else:
                        raise ValueError("Invalid estimate ID format")
                except (ValueError, IndexError):
                    # If any error occurs, start with 1
                    next_increment = 1
            else:
                next_increment = 1

            # Format: garage_id/incremental_number/financial_year
            if self.garage:
                self.estimateid = f"{self.garage.id}/{next_increment}/{financial_year}"
            else:
                self.estimateid = f"0/{next_increment}/{financial_year}"
        
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        related_objects = [
            (self.estimate_product_catalogues, "estimate product catalogues"),
            (self.estimate_services, "estimate services"),
            (self.jobcard, "jobcard"),
        ]
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            ) 
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "estimate"
        ordering = ['-created_at']
      

class AccessModules(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.submodules, "submodules"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )  
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = 'access_modules' 


class AccessSubmodules(models.Model):
    module = models.ForeignKey(AccessModules, on_delete=models.CASCADE, related_name='submodules')
    name = models.CharField(max_length=255)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.permissions, "permissions"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )  
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = 'access_submodules' 


class AccessPermissions(models.Model):
    READ = 'read'
    ADD = 'add'
    EDIT = 'edit'
    DELETE = 'delete'
    PERMISSION_CHOICES = [
        (READ, 'Read'),
        (ADD, 'Add'),
        (EDIT, 'Edit'),
        (DELETE, 'Delete'),
    ]

    submodule = models.ForeignKey(AccessSubmodules, on_delete=models.CASCADE, related_name='permissions')
    permission_type = models.CharField(max_length=10, choices=PERMISSION_CHOICES)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.business_permissions, "business permissions"),
            (self.roles_permissions, "roles permissions"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )  
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = 'access_permissions'


class BusinessPermissions(models.Model):
    permission = models.ForeignKey('AccessPermissions', on_delete=models.CASCADE, related_name='business_permissions')
    value = models.CharField(max_length=255)

    class Meta:
        db_table = 'business_permissions'


class Roles(models.Model): 
    name = models.CharField(max_length=255, unique=True)    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.roles_permissions, "roles permissions"),
            (self.users, "users"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)  

    class Meta:
        db_table = 'roles'
        ordering = ['-created_at']   


class RolesPermissions(models.Model):
    role = models.ForeignKey('Roles', on_delete=models.CASCADE, related_name='roles_permissions')
    permission = models.ForeignKey('AccessPermissions', on_delete=models.CASCADE, related_name='roles_permissions')
    value = models.CharField(max_length=255)

    class Meta:
        db_table = 'roles_permissions'
        unique_together = ('role', 'permission')


class Users(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    email = models.EmailField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=20, blank=True, null=True)
    password = models.CharField(max_length=255)
    status = models.CharField(max_length=255, choices=STATUS_CHOICES)
    expiry = models.DateTimeField(blank=True, null=True)
    password_reset_interval = models.PositiveIntegerField(default=0)
    password_reset_flag = models.BooleanField(default=False)
    password_reset_duration = models.DateTimeField(blank=True, null=True)
    roles = models.ForeignKey('Roles', on_delete=models.CASCADE, related_name='users')     
    garagegroup = models.ForeignKey('GarageGroup', on_delete=models.CASCADE, related_name='users', blank=True, null=True)   
    usertype = models.CharField(max_length=50, default='admin') 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def next_password_reset(self):
        """Calculates the next password reset date."""
        if self.password_reset_duration and self.password_reset_interval:
            return self.password_reset_duration + timedelta(days=self.password_reset_interval)
        return None  # Return None if values are not set

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.tasks, "tasks"),
            (self.task_comments, "task_comments"),
            # (self.options, "options"),
            (self.notes, "notes"),
            # (self.users_accesses, "users accesses"),
            (self.rel_garage_user, "rel garage user"),
            (self.rel_city_user, "rel city user"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs) 

    class Meta:
        db_table = 'users' 
        ordering = ['-created_at']   


class RelGarageUser(models.Model):
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="rel_garage_user")
    user = models.ForeignKey('Users', on_delete=models.CASCADE, related_name="rel_garage_user")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_garage_user"
        ordering = ['-created_at']


class UsersAccesses(models.Model):
    user = models.ForeignKey('Users', on_delete=models.CASCADE, related_name="users_accesses") 
    module = models.CharField(max_length=255, blank=True, null=True)
    value = models.CharField(max_length=255, blank=True, null=True) 

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:             
        unique_together = ('user', 'module')
        db_table = "users_accesses"
        ordering = ['-created_at']   


class AuditLog(models.Model):
    username = models.CharField(max_length=200)
    action = models.CharField(max_length=200)
    event = models.CharField(max_length=200)
    result_code = models.IntegerField()
    duration = models.DateTimeField(auto_now_add=True)   
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'auditlog'  
        ordering = ['-duration']        


class Employees(models.Model):
    name = models.CharField(max_length=255)
    designation = models.CharField(max_length=255, blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, null=True)
    reporting_manager = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='team_members'
    )
    mobile = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    pic = models.CharField(max_length=255, default='static/custom-assets/images/profile-icon.png')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Validate that the reporting manager cannot be the employee themselves."""
        if self.reporting_manager == self:
            raise ValidationError("An employee cannot report to themselves.")

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.task_assigned, "task_assigned"),
            (self.calls, "calls"),
            (self.team_members, "team_members"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )        
        # Remove the profile picture file if it exists
        if self.pic and self.pic != 'static/custom-assets/images/profile-icon.png':
            pic_path = os.path.join(settings.BASE_DIR, self.pic)
            if os.path.isfile(pic_path):
                os.remove(pic_path)
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    def save(self, *args, **kwargs):
        """Override save to include validation."""
        self.clean()
        super().save(*args, **kwargs)
    
    class Meta:
        db_table = 'employees'
        ordering = ['-created_at']
       

# START: Product

class Suppliers(models.Model):
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="inventory_supplier")
    code = models.CharField(max_length=100, blank=True, null=True)
    supplier = models.CharField(max_length=255)
    name = models.CharField(max_length=255,blank=True, null=True)
    email = models.EmailField(max_length=255,blank=True, null=True)
    mobile = models.CharField(max_length=15)
    location = models.CharField(max_length=255)
    address = models.CharField(max_length=255,blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.stock_inwards, "stock inwards"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            ) 
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "inventory_supplier"
        ordering = ['-created_at']


class ProductCategories(models.Model):
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="inventory_categories")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.product_catalogues, "product catalogues"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            ) 
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        unique_together = ('garage', 'name')
        db_table = "inventory_categories"
        ordering = ['-created_at']


class ProductBrands(models.Model):    
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="inventory_brands")
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.product_catalogues, "product catalogues"),
            (self.product_model, "product model"),  
            (self.rel_product_catalogues_brands, "rel product catalogues brands"),
            (self.jobcard_parts, "jobcard parts"),
            (self.jobcard_services, "jobcard services"),        
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            ) 
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        unique_together = ('garage', 'name')
        db_table = "inventory_brands" 
        ordering = ['-created_at']    


class ProductModel(models.Model):    
    brand = models.ForeignKey('ProductBrands', on_delete=models.CASCADE, related_name="product_model")
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.rel_product_catalogues_model, "rel product catalogues model"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            ) 
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        unique_together = ('brand', 'name')
        db_table = "inventory_model" 
        ordering = ['-created_at']  


class ProductCatalogues(models.Model):
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="product_catalogues")
    code = models.CharField(max_length=100, blank=True, null=True)
    name = models.CharField(max_length=255)
    part_number = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    cc = models.CharField(max_length=100, blank=True, null=True)
    category = models.ForeignKey('ProductCategories', on_delete=models.CASCADE, related_name="product_catalogues")
    sub_category = models.CharField(max_length=100, blank=True, null=True)
    brand = models.ForeignKey('ProductBrands', on_delete=models.CASCADE, related_name="product_catalogues", blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    inward_stock = models.IntegerField(default=0)
    outward_stock = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    measuring_unit = models.CharField(max_length=255)
    min_stock = models.IntegerField(default=0, help_text='Minimum stock level for low stock alerts')
    price_includes_gst = models.BooleanField(default=False, help_text='Whether the MRP includes GST')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def stock_status(self):
        """Returns stock status based on current stock and minimum stock level."""
        current = self.current_stock
        if current <= 0:
            return "Out of Stock"
        elif current <= self.min_stock:
            return "Low Stock"
        else:
            return "In Stock"   

    @property
    def current_stock(self):
        """Calculates the available stock."""
        return self.inward_stock - self.outward_stock

    @property
    def selling_price(self):
        """Calculates the final selling price including GST and discount."""
        return (self.price + (self.price * self.gst / 100)) - (self.price * self.discount / 100)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.stock_inwards, "stock inwards"),
            (self.stock_outwards, "stock outwards"),
            (self.invoice_product_catalogues, "invoice product catalogues"),
            (self.estimate_product_catalogues, "estimate product catalogues"),
            (self.rel_product_catalogues_model, "rel product catalogues model"),
            (self.rel_product_catalogues_brands, "rel product catalogues brands"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            ) 
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "product_catalogues" 
        ordering = ['-created_at']  


class StockInwards(models.Model):    
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="stock_inwards")
    product = models.ForeignKey('ProductCatalogues', on_delete=models.CASCADE, related_name="stock_inwards")
    quantity = models.IntegerField(default=0)
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    price_includes_gst = models.BooleanField(default=False, help_text='Whether the rate includes GST')
    supplier = models.ForeignKey('Suppliers', on_delete=models.CASCADE, related_name="stock_inwards")
    supplier_invoice_no = models.CharField(max_length=100, blank=True, null=True)
    supplier_invoice_date = models.DateField(blank=True, null=True)
    supplier_invoice_path = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(blank=True, null=True, max_length=255)
    rack = models.CharField(blank=True, null=True, max_length=100)
    track_expiry = models.BooleanField(default=False)
    expiry_date = models.DateField(blank=True, null=True)
    warranty = models.DateTimeField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        """Delete supplier invoice file when record is deleted."""
        if self.supplier_invoice_path:
            invoice_path = os.path.join(settings.BASE_DIR, self.supplier_invoice_path)
            if os.path.isfile(invoice_path):
                os.remove(invoice_path)
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "inventory_stock_inwards"
        ordering = ['-created_at']


class StockOutwards(models.Model):
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="stock_outwards")
    product = models.ForeignKey('ProductCatalogues', on_delete=models.CASCADE, related_name="stock_outwards")
    quantity = models.IntegerField(default=0)
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    issued_to = models.CharField(max_length=255, blank=True, null=True)
    issued_date = models.DateField(blank=True, null=True)
    usage_purpose = models.CharField(max_length=255, blank=True, null=True)
    reference_document = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(blank=True, null=True, max_length=255)
    rack = models.CharField(blank=True, null=True, max_length=100)
    remarks = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "inventory_stock_outwards"
        ordering = ['-created_at']


class relInvoiceProductCatalogues(models.Model):
    PART_SOURCE_CHOICES = [
        ('inventory', 'Inventory'),
        ('external', 'External'),
    ]

    invoice = models.ForeignKey('Invoice', on_delete=models.CASCADE, related_name="invoice_product_catalogues")
    part = models.ForeignKey('ProductCatalogues', on_delete=models.CASCADE, related_name="invoice_product_catalogues", blank=True, null=True)
    part_source = models.CharField(max_length=20, choices=PART_SOURCE_CHOICES)
    part_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    part_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    part_tax = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    part_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_invoice_product_catalogues"
        ordering = ['-created_at']


class relEstimateProductCatalogues(models.Model):
    PART_SOURCE_CHOICES = [
        ('inventory', 'Inventory'),
        ('external', 'External'),
    ]

    estimate = models.ForeignKey('Estimate', on_delete=models.CASCADE, related_name="estimate_product_catalogues")
    part = models.ForeignKey('ProductCatalogues', on_delete=models.CASCADE, related_name="estimate_product_catalogues", blank=True, null=True)
    part_source = models.CharField(max_length=20, choices=PART_SOURCE_CHOICES)
    part_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    part_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    part_tax = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    part_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_estimate_product_catalogues"
        ordering = ['-created_at']


class RelProductCataloguesModel(models.Model):
    product_catalogues = models.ForeignKey('ProductCatalogues', on_delete=models.CASCADE, related_name="rel_product_catalogues_model")  
    product_model = models.ForeignKey('ProductModel', on_delete=models.CASCADE, related_name="rel_product_catalogues_model")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_product_catalogues_model"
        ordering = ['-created_at']


class RelProductCataloguesBrands(models.Model):
    product_catalogues = models.ForeignKey('ProductCatalogues', on_delete=models.CASCADE, related_name="rel_product_catalogues_brands")  
    product_brands = models.ForeignKey('ProductBrands', on_delete=models.CASCADE, related_name="rel_product_catalogues_brands")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_product_catalogues_brands"
        ordering = ['-created_at'] 

               
# END: Product
        
class TXNService(models.Model):        
    garage = models.ForeignKey('Garage',on_delete=models.CASCADE,related_name='txn_service', blank=True, null=True)
    name = models.CharField(max_length=255)        
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.invoice_services, "invoice services"),
            (self.estimate_services, "estimate services"),
            # (self.rel_garage_txn_service, "rel garage txn service"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            ) 
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "invoice_service"


class relInvoiceService(models.Model):
    PART_SOURCE_CHOICES = [
        ('service', 'Service'),
        ('external', 'External'),
    ]

    invoice = models.ForeignKey('Invoice', on_delete=models.CASCADE, related_name="invoice_services")
    service = models.ForeignKey('TXNService', on_delete=models.CASCADE, related_name="invoice_services", blank=True, null=True)
    service_source = models.CharField(max_length=20, choices=PART_SOURCE_CHOICES)
    service_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    service_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    service_tax = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    service_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_invoice_services"
        ordering = ['-created_at']


class relEstimateService(models.Model):
    PART_SOURCE_CHOICES = [
        ('service', 'Service'),
        ('external', 'External'),
    ]

    estimate = models.ForeignKey('Estimate', on_delete=models.CASCADE, related_name="estimate_services")
    service = models.ForeignKey('TXNService', on_delete=models.CASCADE, related_name="estimate_services", blank=True, null=True)
    service_source = models.CharField(max_length=20, choices=PART_SOURCE_CHOICES)
    service_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    service_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    service_tax = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    service_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_estimate_services"
        ordering = ['-created_at']


class ServiceCategory(models.Model):  
    STATUS = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]   
    name = models.CharField(max_length=255)     
    status = models.CharField(max_length=20, choices=STATUS)    
    image_path = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.rel_garage_servicecategory, "rel garage servicecategory"),   
            (self.rel_city_servicecategory, "rel city servicecategory"),        
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )   
        """Delete associated images when the record is deleted."""
        image_fields = ["image_path"]
        for field in image_fields:
            image_path = getattr(self, field, None)
            if image_path:
                full_path = os.path.join(settings.BASE_DIR, image_path)
                if os.path.isfile(full_path):
                    os.remove(full_path)        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "servicecategory"


class RelGarageServiceCategory(models.Model):
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="rel_garage_servicecategory")
    servicecategory = models.ForeignKey('ServiceCategory', on_delete=models.CASCADE, related_name="rel_garage_servicecategory")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_garage_servicecategory"
        ordering = ['-created_at']


class RelCityServiceCategory(models.Model):
    city = models.ForeignKey('City', on_delete=models.CASCADE, related_name="rel_city_servicecategory")
    servicecategory = models.ForeignKey('ServiceCategory', on_delete=models.CASCADE, related_name="rel_city_servicecategory")
    display = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_city_servicecategory"
        unique_together = ('city', 'servicecategory')
        ordering = ['-created_at']


class GarageServicetype(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]   
    name = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.garage_service, "garage service"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)
    
    class Meta:
        db_table = "garage_servicetype"
        ordering = ['-created_at']
        

class GarageService(models.Model):   
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]     
    service_type = models.ForeignKey('GarageServicetype', on_delete=models.CASCADE, related_name='garage_service')
    name = models.CharField(max_length=255)  
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')      
    description = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.rel_garage_service, "rel garage service"),
            (self.subscriberbookingservices, "subscriber booking services"),            
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )
        super().delete(*args, **kwargs) 

    class Meta:
        db_table = "garage_service"
        ordering = ['-created_at']


class RelCityUser(models.Model):
    city = models.ForeignKey('City', on_delete=models.CASCADE, related_name="rel_city_user")
    user = models.ForeignKey('Users', on_delete=models.CASCADE, related_name="rel_city_user")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_city_user"
        unique_together = ('city', 'user')
        ordering = ['-created_at']


class Brand(models.Model):  
    STATUS = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]     
    name = models.CharField(max_length=255)     
    status = models.CharField(max_length=20, choices=STATUS)    
    image_path = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.model, "model"),           
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )   
        """Delete associated images when the record is deleted."""
        image_fields = ["image_path"]
        for field in image_fields:
            image_path = getattr(self, field, None)
            if image_path:
                full_path = os.path.join(settings.BASE_DIR, image_path)
                if os.path.isfile(full_path):
                    os.remove(full_path)        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "brand"  
        ordering = ['-created_at']      


class CC(models.Model):        
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]  
    name = models.CharField(max_length=255)
    from_value = models.PositiveIntegerField(help_text='Engine capacity in CC (e.g., 100, 150, 200)')
    to_value = models.PositiveIntegerField(help_text='Maximum engine capacity in CC (e.g., 150, 200, 250)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()
        if self.to_value <= self.from_value:
            raise ValidationError({
                'to_value': 'To value must be greater than from value'
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.model, "model"),       
            (self.rel_garage_service, "rel garage service"),    
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )         
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)    

    class Meta:
        db_table = "cc"
        ordering = ['-created_at']


class Model(models.Model):      
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    brand = models.ForeignKey('Brand',on_delete=models.CASCADE,related_name='model')
    cc = models.ForeignKey('CC',on_delete=models.CASCADE,related_name='model')
    name = models.CharField(max_length=255) 
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)       
    image_path = models.CharField(max_length=255, blank=True, null=True)
    vehicletype = models.CharField(max_length=255, default='2')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs): 
        # List of related objects to check
        related_objects = [
            (self.subscribervehicle, "subscriber vehicle"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )         
        """Delete associated images when the record is deleted."""
        image_fields = ["image_path"]
        for field in image_fields:
            image_path = getattr(self, field, None)
            if image_path:
                full_path = os.path.join(settings.BASE_DIR, image_path)
                if os.path.isfile(full_path):
                    os.remove(full_path)        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "model" 
        ordering = ['-created_at']  


class SubscriberVehicle(models.Model):
    subscriber = models.ForeignKey('Subscriber', on_delete=models.CASCADE, related_name='subscribervehicle')
    model = models.ForeignKey('Model', on_delete=models.CASCADE, related_name='subscribervehicle')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.subscriberbooking, "subscriber booking"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )         
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "subscribervehicle"
        ordering = ['-created_at']    


class SubscriberAddress(models.Model):
    subscriber = models.ForeignKey('Subscriber', on_delete=models.CASCADE, related_name='subscriberaddress')
    city = models.ForeignKey('City', on_delete=models.CASCADE, related_name='subscriberaddress')
    address = models.TextField()
    pincode = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.subscriberbooking, "subscriber booking"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )         
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "subscriberaddress"
        ordering = ['-created_at']


class BookingStatus(models.Model):
    name = models.CharField(max_length=255, unique=True)
    displayname = models.CharField(max_length=255)
    parentid = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.bookingtimeline, "booking timeline"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )         
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "subscriberbookingstatus"
        ordering = ['-created_at']


class SubscriberBooking(models.Model):        
    subscriber = models.ForeignKey('Subscriber', on_delete=models.CASCADE, related_name='subscriberbooking')
    subscribervehicle = models.ForeignKey('SubscriberVehicle', on_delete=models.CASCADE, related_name='subscriberbooking')
    subscriberaddress = models.ForeignKey('SubscriberAddress', on_delete=models.CASCADE, related_name='subscriberbooking')
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='subscriberbooking', null=True, blank=True)
    vehicle = models.ForeignKey(
        'Vehicle', on_delete=models.CASCADE,
        related_name="subscriberbooking", null=True, blank=True
    )
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name='subscriberbooking')
    jobcard_id = models.CharField(max_length=255, blank=True, null=True)
    booking_date = models.DateField()
    booking_slot = models.CharField(max_length=255)
    suggestion = models.TextField(blank=True, null=True)
    booking_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    promo_code = models.CharField(max_length=255, blank=True, null=True)
    promo_code_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    # payment_id = models.CharField(max_length=255, blank=True, null=True)
    # payment_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    # payment_date = models.DateTimeField(auto_now_add=True)
    # payment_method = models.CharField(max_length=255, blank=True, null=True)
    # payment_status = models.CharField(max_length=255, default='pending')
    required_estimate = models.BooleanField(default=False)
    cancel_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.subscriberbookingaccessories, "subscriber booking accessories"),
            (self.subscriberbookingservices, "subscriber booking services"),
            (self.bookingtimeline, "booking timeline"),
            (self.subscriberbookingreview, "subscriber booking review"),
            (self.jobcard, "jobcard"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )         
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "subscriberbooking"
        ordering = ['-created_at']


class BookingTimeline(models.Model):
    booking = models.ForeignKey('SubscriberBooking', on_delete=models.CASCADE, related_name='bookingtimeline')
    status = models.ForeignKey('BookingStatus', on_delete=models.CASCADE, related_name='bookingtimeline')
    remark = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('booking', 'status')
        db_table = "subscriberbookingtimeline"
        ordering = ['-created_at']


class SubscriberBookingReview(models.Model):
    subscriberbooking = models.ForeignKey('SubscriberBooking', on_delete=models.CASCADE, related_name='subscriberbookingreview')
    review = models.TextField(blank=True, null=True)
    review_title = models.CharField(max_length=255, blank=True, null=True)
    rating = models.DecimalField(
        max_digits=3,  # 3 digits in total (1 before decimal, 1 after)
        decimal_places=1,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        help_text='SubscriberBookingReview rating from 0.0 to 5.0'
    )
    image_path = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):
        """Delete associated images when the record is deleted."""
        image_fields = ["image_path"]
        for field in image_fields:
            image_path = getattr(self, field, None)
            if image_path:
                full_path = os.path.join(settings.BASE_DIR, image_path)
                if os.path.isfile(full_path):
                    os.remove(full_path) 
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "subscriberbookingreview"
        ordering = ['-created_at']


class SubscriberBookingServices(models.Model):         
    subscriberbooking = models.ForeignKey('SubscriberBooking', on_delete=models.CASCADE, related_name='subscriberbookingservices')
    service = models.ForeignKey('GarageService', on_delete=models.CASCADE, related_name='subscriberbookingservices')
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscriberbookingservices"
        ordering = ['-created_at']


class Accessories(models.Model):        
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    name = models.CharField(max_length=255)     
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)       
    image_path = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):  
        # List of related objects to check
        related_objects = [
            (self.subscriberbookingaccessories, "subscriber booking accessories"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )         
        """Delete associated images when the record is deleted."""
        image_fields = ["image_path"]
        for field in image_fields:
            image_path = getattr(self, field, None)
            if image_path:
                full_path = os.path.join(settings.BASE_DIR, image_path)
                if os.path.isfile(full_path):
                    os.remove(full_path)        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "accessories" 
        ordering = ['-created_at']     


class SubscriberBookingAccessories(models.Model):        
    subscriberbooking = models.ForeignKey('SubscriberBooking', on_delete=models.CASCADE, related_name='subscriberbookingaccessories')
    accessories = models.ForeignKey('Accessories', on_delete=models.CASCADE, related_name='subscriberbookingaccessories')
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscriberbookingaccessories"
        ordering = ['-created_at']  


class Banner(models.Model):        
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    city = models.ForeignKey('City',on_delete=models.CASCADE,related_name='banner')
    order = models.PositiveIntegerField(help_text='Order (e.g., 1, 2, 3, 4, 5)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)       
    image_path = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs):  
        """Delete associated images when the record is deleted."""
        image_fields = ["image_path"]
        for field in image_fields:
            image_path = getattr(self, field, None)
            if image_path:
                full_path = os.path.join(settings.BASE_DIR, image_path)
                if os.path.isfile(full_path):
                    os.remove(full_path)        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "banner"
        ordering = ['order'] 


class RelGarageService(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="rel_garage_service")
    service = models.ForeignKey('GarageService', on_delete=models.CASCADE, related_name="rel_garage_service")  
    cc = models.ForeignKey('CC', on_delete=models.CASCADE, related_name="rel_garage_service")   
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)    
    description = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rel_garage_service"        
        ordering = ['-created_at']  

        
class GarageBanner(models.Model):        
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="garage_banner")
    order = models.PositiveIntegerField(help_text='Order (e.g., 1, 2, 3, 4, 5)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)       
    image_path = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def delete(self, *args, **kwargs): 
        """Delete associated images when the record is deleted."""
        image_fields = ["image_path"]
        for field in image_fields:
            image_path = getattr(self, field, None)
            if image_path:
                full_path = os.path.join(settings.BASE_DIR, image_path)
                if os.path.isfile(full_path):
                    os.remove(full_path)        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "garage_banner"
        ordering = ['order']
        unique_together = ('garage', 'order')                  


# START JOB CARD MODEL

# class VehicleCommonIssues(models.Model):
#     VEHICLE_TYPE_CHOICES = [
#         ('2', '2 Wheeler'),
#         ('3', '3 Wheeler'),
#         ('4', '4 Wheeler'),
#         ('6', '6 Wheeler'),
#     ]
#     garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="vehicle_common_issues")
#     name = models.CharField(max_length=255) 
#     displayname = models.CharField(max_length=255)     
#     vehicletype = models.CharField(max_length=100, choices=VEHICLE_TYPE_CHOICES)  
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def delete(self, *args, **kwargs):
#         # List of related objects to check
#         related_objects = [
#             (self.jobcard_vehicle_common_issues, "jobcard vehicle common issues"),
#         ]
#         # Check if any related object exists and identify the associations
#         associations = [
#             description for obj, description in related_objects if obj.exists()
#         ]
#         if associations:
#             raise ValidationError(
#                 f"Deletion Failed: Associated with {', '.join(associations)}."
#             )   
#         # Proceed with deletion if no associations exist
#         super().delete(*args, **kwargs)

#     class Meta:
#         db_table = "vehicle_common_issues"
#         unique_together = ('garage', 'name', 'vehicletype')
#         ordering = ['-created_at']
        

# class VehicleAccessories(models.Model): 
#     VEHICLE_TYPE_CHOICES = [
#         ('2', '2 Wheeler'),
#         ('3', '3 Wheeler'),
#         ('4', '4 Wheeler'),
#         ('6', '6 Wheeler'),
#     ]  
#     garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="vehicle_accessories")
#     name = models.CharField(max_length=255) 
#     displayname = models.CharField(max_length=255) 
#     vehicletype = models.CharField(max_length=100, choices=VEHICLE_TYPE_CHOICES)  
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def delete(self, *args, **kwargs):
#         # List of related objects to check
#         related_objects = [
#             (self.jobcard_vehicle_accessories, "jobcard vehicle accessories"),
#         ]
#         # Check if any related object exists and identify the associations
#         associations = [
#             description for obj, description in related_objects if obj.exists()
#         ]
#         if associations:
#             raise ValidationError(
#                 f"Deletion Failed: Associated with {', '.join(associations)}."
#             )   
#         # Proceed with deletion if no associations exist
#         super().delete(*args, **kwargs)

#     class Meta:
#         db_table = "vehicle_accessories"
#         unique_together = ('garage', 'name', 'vehicletype')
#         ordering = ['-created_at']


# class ServiceChecklist(models.Model):   
#     VEHICLE_TYPE_CHOICES = [
#         ('2', '2 Wheeler'),
#         ('3', '3 Wheeler'),
#         ('4', '4 Wheeler'),
#         ('6', '6 Wheeler'),
#     ]  
#     garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="service_checklist")
#     name = models.CharField(max_length=255) 
#     displayname = models.CharField(max_length=255)   
#     vehicletype = models.CharField(max_length=100, choices=VEHICLE_TYPE_CHOICES)  
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def delete(self, *args, **kwargs):
#         # List of related objects to check
#         related_objects = [
#             (self.jobcard_service_checklist, "jobcard service checklist"),
#         ]
#         # Check if any related object exists and identify the associations
#         associations = [
#             description for obj, description in related_objects if obj.exists()
#         ]
#         if associations:
#             raise ValidationError(
#                 f"Deletion Failed: Associated with {', '.join(associations)}."
#             )   
#         # Proceed with deletion if no associations exist
#         super().delete(*args, **kwargs)

#     class Meta:
#         db_table = "service_checklist"
#         unique_together = ('garage', 'name', 'vehicletype')
#         ordering = ['-created_at']        


class JobType(models.Model):    
    VEHICLE_TYPE_CHOICES = [
        ('2', '2 Wheeler'),
        ('3', '3 Wheeler'),
        ('4', '4 Wheeler'),
        ('6', '6 Wheeler'),
    ]
    name = models.CharField(max_length=255)
    garage = models.ForeignKey(
        'Garage', on_delete=models.CASCADE,
        related_name='jobtype'
    )
    vehicletype = models.CharField(max_length=100, choices=VEHICLE_TYPE_CHOICES) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.jobcard, "jobcard"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )   
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        unique_together = ('name', 'garage', 'vehicletype')
        db_table = "jobtype"
        ordering = ['-created_at']
        

class Jobcard(models.Model):
    VEHICLE_TYPE_CHOICES = [
        ('2', '2 Wheeler'),
        ('3', '3 Wheeler'),
        ('4', '4 Wheeler'),
        ('6', '6 Wheeler'),
    ]
    VEHICLE_FUELTYPE_CHOICES = [
        ('petrol', 'Petrol'),
        ('diesel', 'Diesel'),
        ('cng', 'CNG'),
        ('ev', 'EV'),
    ]
    MODE_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
    ]
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('finalized', 'Finalized'),
    ]

    jobtype = models.ForeignKey(
        'JobType', 
        on_delete=models.CASCADE,
        related_name='jobcard',
        null=True,  # Make it nullable
        blank=True  # Allow blank in forms
    )

    garage = models.ForeignKey(
        'Garage', on_delete=models.CASCADE,
        related_name='jobcard'
    )

    booking = models.ForeignKey(
        'SubscriberBooking', on_delete=models.CASCADE,
        related_name="jobcard", null=True, blank=True
    )

    customer = models.ForeignKey(
        'Customer', on_delete=models.CASCADE,
        related_name="jobcard", null=True, blank=True
    )

    vehicle = models.ForeignKey(
        'Vehicle', on_delete=models.CASCADE,
        related_name="jobcard", null=True, blank=True
    )


    supervisor = models.ForeignKey(
        'GarageStaff', on_delete=models.CASCADE,
        related_name="jobcard", null=True, blank=True
    )
    
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, editable=False)

    # Accessories and Damage
    damagephotos = models.JSONField(blank=True, default=list)

    # Delivery details
    delivery_date = models.DateField(null=True, blank=True)
    delivery_time = models.TimeField(null=True, blank=True)
    
    # Vehicle diagram
    diagram_image = models.CharField(max_length=255, blank=True, null=True, 
                                   help_text="Path to the vehicle diagram image with dent markings")

    # # Dent positions
    # dent_positions = models.JSONField(
    #     blank=True, 
    #     null=True,
    #     default=list,
    #     help_text="Stores the coordinates and details of dents on the vehicle"
    # )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    jobcard_number = models.CharField(max_length=255,null=True, blank=True) 
    current_date = models.DateField(null=True, blank=True)
    fuel_level = models.CharField(max_length=255,null=True, blank=True) 
    km_reading = models.CharField(max_length=255,null=True, blank=True) 
    vehicle_issue_description = models.TextField(blank=True, null=True)
    vehicle_damage_description = models.TextField(blank=True, null=True)
    vehicle_accessory_description = models.TextField(blank=True, null=True)
    vehicle_type = models.CharField(max_length=20, default='2')
    work_note = models.TextField(blank=True, null=True)
    delivery_timeline = models.DateTimeField(null=True, blank=True)
    reminder_duration = models.IntegerField(default=0)
    reminder_km = models.IntegerField(default=0)
    created_by = models.ForeignKey(
        'Users', on_delete=models.CASCADE,
        related_name="jobcard", null=True, blank=True
    )
    random_uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    

    def save(self, *args, **kwargs):
        self.mode = 'online' if self.booking else 'offline'
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Delete all related objects first
        self.jobcard_parts.all().delete()
        self.jobcard_services.all().delete()
        self.jobcard_customer_voice.all().delete()
        self.jobcard_mechanic.all().delete()
        self.jobcard_vehicle_issue.all().delete()
        self.jobcard_vehicle_damage.all().delete()
        self.jobcard_vehicle_accessory.all().delete()
        self.jobcard_payments.all().delete()
        
        # Track directories to clean up
        photo_dirs = set()
        
        # Delete image files and track their directories
        for path in self.damagephotos:
            full_path = os.path.join(settings.BASE_DIR, 'static', path)
            if os.path.isfile(full_path):
                # Add the directory to our set for cleanup
                photo_dirs.add(os.path.dirname(full_path))
                os.remove(full_path)
        
        # Clean up empty directories
        for dir_path in photo_dirs:
            try:
                # Remove directory if it's empty
                if os.path.exists(dir_path) and not os.listdir(dir_path):
                    os.rmdir(dir_path)
            except Exception as e:
                print(f"Error removing directory {dir_path}: {str(e)}")
                
        # Delete diagram image if it exists
        if self.diagram_image:
            diagram_path = os.path.join(settings.BASE_DIR, 'static', self.diagram_image.lstrip('/'))
            if os.path.isfile(diagram_path):
                os.remove(diagram_path)
                # Also try to remove the diagram's directory if it's empty
                try:
                    diagram_dir = os.path.dirname(diagram_path)
                    if os.path.exists(diagram_dir) and not os.listdir(diagram_dir):
                        os.rmdir(diagram_dir)
                except Exception as e:
                    print(f"Error removing diagram directory: {str(e)}")
        
        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)

    class Meta:
        db_table = "jobcard"
        # unique_together = ('garage', 'customer', 'vehicle', 'mode')
        ordering = ['-created_at']

    def get_damage_photos(self):
        """
        Returns a list of damage photo URLs.
        If damagephotos is a string, it will be loaded as JSON.
        Returns an empty list if no photos are found or if there's an error.
        """
        if not self.damagephotos:
            return []
            
        try:
            # If damagephotos is a string, try to load it as JSON
            if isinstance(self.damagephotos, str):
                photos = json.loads(self.damagephotos)
                # Ensure we return a list even if the JSON is a single string
                return [photos] if isinstance(photos, str) else photos
            # If it's already a list, return it
            elif isinstance(self.damagephotos, list):
                return self.damagephotos
            # For any other case, return as a single-item list
            return [str(self.damagephotos)]
        except (TypeError, json.JSONDecodeError):
            return []

    # def get_dent_positions(self):
    #     """
    #     Returns a list of dent positions with their details.
    #     If dent_positions is a string, it will be loaded as JSON.
    #     Returns an empty list if no dents are found or if there's an error.
    #     """
    #     if not self.dent_positions:
    #         return []
            
    #     try:
    #         # If dent_positions is a string, try to load it as JSON
    #         if isinstance(self.dent_positions, str):
    #             positions = json.loads(self.dent_positions)
    #             # Ensure we return a list even if the JSON is a single object
    #             return [positions] if isinstance(positions, dict) else positions
    #         # If it's already a list, return it
    #         elif isinstance(self.dent_positions, list):
    #             return self.dent_positions
    #         # For any other case, return as a single-item list
    #         return [str(self.dent_positions)]
    #     except (TypeError, json.JSONDecodeError) as e:
    #         logger.error(f"Error parsing dent_positions: {e}")
    #         return []


# class JobcardVehicleCommonIssues(models.Model):
#     STATUS_CHOICES = [
#         ('active', 'Active'),
#         ('inactive', 'Inactive'),
#     ]
#     jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_vehicle_common_issues")  
#     vehiclecommonissues = models.ForeignKey('VehicleCommonIssues', on_delete=models.CASCADE, related_name="jobcard_vehicle_common_issues")
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES)    
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = "jobcard_vehicle_common_issues"
#         unique_together = ('jobcard', 'vehiclecommonissues')
#         ordering = ['-created_at']


# class JobcardVehicleAccessories(models.Model):   
#     jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_vehicle_accessories")  
#     vehicleaccessories = models.ForeignKey('VehicleAccessories', on_delete=models.CASCADE, related_name="jobcard_vehicle_accessories")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = "jobcard_vehicle_accessories"
#         unique_together = ('jobcard', 'vehicleaccessories')
#         ordering = ['-created_at']


# class JobcardServiceChecklist(models.Model):   
#     jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_service_checklist")  
#     servicechecklist = models.ForeignKey('ServiceChecklist', on_delete=models.CASCADE, related_name="jobcard_service_checklist")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = "jobcard_service_checklist"
#         unique_together = ('jobcard', 'servicechecklist')
#         ordering = ['-created_at']
        
        

class Jobcard_Assigned(models.Model):   
    jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_assigned_staff")  
    garage_staff = models.ForeignKey('GarageStaff', on_delete=models.CASCADE,related_name='jobcard_garage_staff') 
    role = models.CharField(max_length=200)
    
    class Meta:
        db_table = "jobcard_assigned"
        
# END JOB CARD MODEL      

class JobcardParts(models.Model):
    PART_SOURCE_CHOICES = [
        ('internal', 'Internal'),
        ('external', 'External'),
    ]

    jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_parts", blank=True, null=True)
    part = models.ForeignKey('ProductCatalogues', on_delete=models.CASCADE, related_name="jobcard_parts", blank=True, null=True)
    part_source = models.CharField(max_length=20, choices=PART_SOURCE_CHOICES)
    part_name = models.CharField(max_length=255)
    part_number = models.CharField(max_length=100, blank=True, null=True)
    code = models.CharField(max_length=100, blank=True, null=True)
    quantity = models.PositiveIntegerField(default=1)
    part_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    part_tax = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    part_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "jobcard_parts"
        ordering = ['-created_at']

class JobcardServices(models.Model):
    SERVICE_SOURCE_CHOICES = [
        ('internal', 'Internal'),
        ('external', 'External'),
    ]

    jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_services", blank=True, null=True)
    service = models.ForeignKey('TXNService', on_delete=models.CASCADE, related_name="jobcard_services", blank=True, null=True)
    service_source = models.CharField(max_length=20, choices=SERVICE_SOURCE_CHOICES)
    service_name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, blank=True, null=True)
    quantity = models.PositiveIntegerField(default=1)
    service_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    service_tax = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    service_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "jobcard_services"
        ordering = ['-created_at']


class JobcardCustomerVoice(models.Model):
    jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_customer_voice")
    customer_voice = models.CharField(max_length=255)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "jobcard_customer_voice"
        ordering = ['-updated_at']


class JobcardMechanic(models.Model):
    jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_mechanic")
    mechanic = models.ForeignKey('GarageStaff', on_delete=models.CASCADE, related_name="jobcard_mechanic")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "jobcard_mechanic"
        ordering = ['-updated_at']


class GarageVehicleIssue(models.Model):  
    VEHICLE_TYPE_CHOICES = [
        ('2', '2 Wheeler'),
        ('3', '3 Wheeler'),
        ('4', '4 Wheeler'),
        ('6', '6 Wheeler'),
    ]
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="garage_vehicle_issue")  
    vehicle_issue = models.CharField(max_length=255)  
    vehicletype = models.CharField(max_length=100, choices=VEHICLE_TYPE_CHOICES)  
    updated_at = models.DateTimeField(auto_now=True)  

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.jobcard_vehicle_issue, "jobcard vehicle issue"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )

        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)
    
    class Meta:  
        db_table = "garage_vehicle_issue"  
        ordering = ['-updated_at']  


class JobcardVehicleIssue(models.Model):
    jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_vehicle_issue")
    vehicleissue = models.ForeignKey('GarageVehicleIssue', on_delete=models.CASCADE, related_name="jobcard_vehicle_issue")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "jobcard_vehicle_issue"
        ordering = ['-updated_at']                


class GarageVehicleDamage(models.Model):  
    VEHICLE_TYPE_CHOICES = [
        ('2', '2 Wheeler'),
        ('3', '3 Wheeler'),
        ('4', '4 Wheeler'),
        ('6', '6 Wheeler'),
    ]
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="garage_vehicle_damage")  
    vehicle_damage = models.CharField(max_length=255)  
    vehicletype = models.CharField(max_length=100, choices=VEHICLE_TYPE_CHOICES)  
    updated_at = models.DateTimeField(auto_now=True)  

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.jobcard_vehicle_damage, "jobcard vehicle damage"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )

        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)
    
    class Meta:  
        db_table = "garage_vehicle_damage"  
        ordering = ['-updated_at']  


class JobcardVehicleDamage(models.Model):
    jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_vehicle_damage")
    vehicledamage = models.ForeignKey('GarageVehicleDamage', on_delete=models.CASCADE, related_name="jobcard_vehicle_damage")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "jobcard_vehicle_damage"
        ordering = ['-updated_at']                


class GarageVehicleAccessory(models.Model):  
    VEHICLE_TYPE_CHOICES = [
        ('2', '2 Wheeler'),
        ('3', '3 Wheeler'),
        ('4', '4 Wheeler'),
        ('6', '6 Wheeler'),
    ]
    garage = models.ForeignKey('Garage', on_delete=models.CASCADE, related_name="garage_vehicle_accessory")  
    vehicle_accessory = models.CharField(max_length=255)  
    vehicletype = models.CharField(max_length=100, choices=VEHICLE_TYPE_CHOICES)  
    updated_at = models.DateTimeField(auto_now=True)  

    def delete(self, *args, **kwargs):
        # List of related objects to check
        related_objects = [
            (self.jobcard_vehicle_accessory, "jobcard vehicle accessory"),
        ]
        # Check if any related object exists and identify the associations
        associations = [
            description for obj, description in related_objects if obj.exists()
        ]
        if associations:
            raise ValidationError(
                f"Deletion Failed: Associated with {', '.join(associations)}."
            )

        # Proceed with deletion if no associations exist
        super().delete(*args, **kwargs)
    
    class Meta:  
        db_table = "garage_vehicle_accessory"  
        ordering = ['-updated_at']  


class JobcardVehicleAccessory(models.Model):
    jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_vehicle_accessory")
    vehicleaccessory = models.ForeignKey('GarageVehicleAccessory', on_delete=models.CASCADE, related_name="jobcard_vehicle_accessory")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "jobcard_vehicle_accessory"
        ordering = ['-updated_at']     


class JobcardPayment(models.Model):
    PAYMENT_MODES = [
        ('cash', 'Cash'),
        ('check', 'Check'),
        ('upi', 'UPI'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    
    jobcard = models.ForeignKey('Jobcard', on_delete=models.CASCADE, related_name="jobcard_payments")
    
    # Payment Information
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODES)
    notes = models.TextField(blank=True, null=True)
    
    # Check Payment Fields
    check_number = models.CharField(max_length=50, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    check_date = models.DateField(blank=True, null=True)
    
    # UPI Payment Fields
    upi_id = models.CharField(max_length=100, blank=True, null=True)
    upi_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Bank Transfer Fields
    account_number = models.CharField(max_length=50, blank=True, null=True)
    account_holder_name = models.CharField(max_length=100, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    transaction_reference = models.CharField(max_length=100, blank=True, null=True)
    
    # System Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "jobcard_payment"
        ordering = ['-payment_date', '-created_at']
    
    def save(self, *args, **kwargs):
        # Add any custom save logic here
        super().save(*args, **kwargs)
    
    def get_payment_details(self):
        """Returns payment details based on payment mode"""
        if self.payment_mode == 'check':
            return {
                'check_number': self.check_number,
                'bank_name': self.bank_name,
                'check_date': self.check_date
            }
        elif self.payment_mode == 'upi':
            return {
                'upi_id': self.upi_id,
                'transaction_id': self.upi_transaction_id
            }
        elif self.payment_mode == 'bank_transfer':
            return {
                'account_number': self.account_number,
                'account_holder_name': self.account_holder_name,
                'ifsc_code': self.ifsc_code,
                'reference': self.transaction_reference
            }
        return {}                          
