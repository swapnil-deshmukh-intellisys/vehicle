from django.conf import settings
from twilio.rest import Client

client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

def send_create_jobcard_message(vehicle_name, jobcard_number, vehicle_number):
    print('skip till number verified')
    # message = client.messages.create(
    #     from_=settings.TWILIO_WHATSAPP_FROM,
    #     content_sid='HX3e616b6228cdcf0805568e62183c46c3',
    #     content_variables='{"1": "%s","2": "%s", "3": "%s"}' % (vehicle_name, jobcard_number, vehicle_number),
    #     to='whatsapp:+919470918684'
    # )
    # print(message.sid)

def reply_to_whatsapp_message():
    message = client.messages.create(
        from_=settings.TWILIO_WHATSAPP_FROM,
        body='Hello, this is a reply from Twilio WhatsApp API!',
        to='whatsapp:+919470918684'
    )
    print(message.sid)