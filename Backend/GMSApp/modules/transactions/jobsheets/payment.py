from django.http import JsonResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction
from django.core.exceptions import ValidationError
import json
import logging
from django.utils import timezone

from GMSApp.models import Jobcard, JobcardPayment

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["GET"])
def list_jobcard_payments(request, jobcard_id=None):
    """
    API to list all payments for a job card
    GET /api/jobcard/payments/<jobcard_id>/
    """
    try:
        # If jobcard_id is not provided in URL, try to get from query params
        jobcard_id = jobcard_id or request.GET.get('jobcard_id')
        if not jobcard_id:
            return JsonResponse(
                {'status': 'error', 'message': 'Jobcard ID is required'}, 
                status=400
            )

        # Get jobcard
        try:
            jobcard = Jobcard.objects.get(id=jobcard_id)
        except Jobcard.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Jobcard not found'}, 
                status=404
            )

        # Get all payments for this jobcard
        payments = JobcardPayment.objects.filter(jobcard=jobcard).order_by('-payment_date', '-created_at')
        
        # Prepare response data
        payment_list = []
        for payment in payments:
            payment_data = {
                'id': payment.id,
                'payment_date': payment.payment_date.isoformat(),
                'amount': float(payment.amount),
                'payment_mode': payment.get_payment_mode_display(),
                'payment_mode_code': payment.payment_mode,
                'notes': payment.notes,
                'created_at': payment.created_at.isoformat(),
                'updated_at': payment.updated_at.isoformat(),
            }
            
            # Add payment mode specific details
            if payment.payment_mode == 'check':
                payment_data.update({
                    'check_number': payment.check_number,
                    'bank_name': payment.bank_name,
                    'check_date': payment.check_date.isoformat() if payment.check_date else None
                })
            elif payment.payment_mode == 'upi':
                payment_data.update({
                    'upi_id': payment.upi_id,
                    'transaction_id': payment.upi_transaction_id
                })
            elif payment.payment_mode == 'bank_transfer':
                payment_data.update({
                    'account_number': payment.account_number,
                    'account_holder_name': payment.account_holder_name,
                    'ifsc_code': payment.ifsc_code,
                    'transaction_reference': payment.transaction_reference
                })
            
            payment_list.append(payment_data)
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'jobcard_id': jobcard.id,
                'jobcard_number': jobcard.jobcard_number,
                'payments': payment_list,
                'total_paid': float(sum(p.amount for p in payments)),
                'payment_count': len(payment_list)
            }
        })
        
    except Exception as e:
        logger.error(f"Error listing jobcard payments: {str(e)}", exc_info=True)
        return JsonResponse(
            {'status': 'error', 'message': 'An error occurred while fetching payments'}, 
            status=500
        )


@csrf_exempt
@require_http_methods(["POST"])
def save_jobcard_payment(request):
    try:        
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError as e:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON data'
            }, status=400)
        
        # Validate required fields
        required_fields = ['jobcard_id', 'payment_date', 'amount', 'payment_mode']
        for field in required_fields:
            if field not in data:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Missing required field: {field}'
                }, status=400)
        
        # Get the jobcard
        try:
            jobcard = Jobcard.objects.get(id=data['jobcard_id'])
        except Jobcard.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Jobcard not found'
            }, status=404)

        # Create payment data dictionary
        payment_data = {
            'jobcard': jobcard,
            'payment_date': data['payment_date'],
            'payment_mode': data['payment_mode'],
            'amount': data['amount'],
            'notes': data.get('notes', ''),
        }

        # Add payment mode specific fields
        payment_mode = data['payment_mode']
        if payment_mode == 'check':
            payment_data.update({
                'check_number': data.get('check_number'),
                'bank_name': data.get('bank_name'),
                'check_date': data.get('check_date') or None
            })
        elif payment_mode == 'upi':
            payment_data.update({
                'upi_id': data.get('upi_id'),
                'upi_transaction_id': data.get('transaction_id')
            })
        elif payment_mode == 'bank_transfer':
            payment_data.update({
                'account_number': data.get('account_number'),
                'account_holder_name': data.get('account_holder_name'),
                'ifsc_code': data.get('ifsc_code'),
                'transaction_reference': data.get('transaction_reference')
            })

        # Create the payment
        payment = JobcardPayment.objects.create(**payment_data)

        return JsonResponse({
            'status': 'success',
            'message': 'Payment saved successfully',
            'data': {
                'payment_id': payment.id
            }
        })

    except Exception as e:
        logger.error(f"Error saving payment: {str(e)}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def update_jobcard_payment(request, payment_id):
    try:
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError as e:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON data'
            }, status=400)
        
        # Get the payment to update
        try:
            payment = JobcardPayment.objects.get(id=payment_id)
        except JobcardPayment.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Payment not found'
            }, status=404)
        
        # Update payment fields if provided
        update_fields = ['payment_date', 'amount', 'payment_mode', 'notes']
        for field in update_fields:
            if field in data:
                setattr(payment, field, data[field])
        
        # Update payment mode specific fields
        payment_mode = data.get('payment_mode', payment.payment_mode)
        
        # Reset all payment mode specific fields first
        payment.check_number = None
        payment.bank_name = None
        payment.check_date = None
        payment.upi_id = None
        payment.upi_transaction_id = None
        payment.account_number = None
        payment.account_holder_name = None
        payment.ifsc_code = None
        payment.transaction_reference = None
        
        # Set the new payment mode specific fields
        if payment_mode == 'check':
            if 'check_number' in data:
                payment.check_number = data['check_number']
            if 'bank_name' in data:
                payment.bank_name = data['bank_name']
            if 'check_date' in data:
                payment.check_date = data['check_date'] or None
        elif payment_mode == 'upi':
            if 'upi_id' in data:
                payment.upi_id = data['upi_id']
            if 'transaction_id' in data:
                payment.upi_transaction_id = data['transaction_id']
        elif payment_mode == 'bank_transfer':
            if 'account_number' in data:
                payment.account_number = data['account_number']
            if 'account_holder_name' in data:
                payment.account_holder_name = data['account_holder_name']
            if 'ifsc_code' in data:
                payment.ifsc_code = data['ifsc_code']
            if 'transaction_reference' in data:
                payment.transaction_reference = data['transaction_reference']
        
        # Update the timestamp
        payment.updated_at = timezone.now()
        
        # Save the updated payment
        payment.save()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Payment updated successfully',
            'data': {
                'payment_id': payment.id
            }
        })
        
    except Exception as e:
        logger.error(f"Error updating payment: {str(e)}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_jobcard_payment(request, payment_id):
    try:
        # Get the payment to delete
        try:
            payment = JobcardPayment.objects.get(id=payment_id)
        except JobcardPayment.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Payment not found'
            }, status=404)
        
        # Delete the payment
        payment_id = payment.id
        payment.delete()
        
        return JsonResponse({
            'status': 'success',
            'message': 'Payment deleted successfully',
            'data': {
                'payment_id': payment_id
            }
        })
        
    except Exception as e:
        logger.error(f"Error deleting payment: {str(e)}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)