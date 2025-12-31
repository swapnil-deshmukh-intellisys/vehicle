# Generated migration for adding price_includes_gst field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('GMSApp', '0083_productcatalogues_min_stock'),
    ]

    operations = [
        migrations.AddField(
            model_name='productcatalogues',
            name='price_includes_gst',
            field=models.BooleanField(default=False, help_text='Whether the MRP includes GST'),
        ),
    ]