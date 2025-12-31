# Generated migration for adding min_stock field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('GMSApp', '0082_relgaragevehicletype_vehicletype_delete_business_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='productcatalogues',
            name='min_stock',
            field=models.IntegerField(default=0, help_text='Minimum stock level for low stock alerts'),
        ),
    ]