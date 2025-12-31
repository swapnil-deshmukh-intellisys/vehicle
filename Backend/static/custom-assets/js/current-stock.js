$(document).ready(function() {
    var $modelSelector = $('#model_selector');
    var $brandSelect = $('select[name="brand"]');
    var $form = $('form');
    
    function loadModelsForBrand(brandId, selectedModel) {
        $modelSelector.empty();
        
        if (brandId) {
            $modelSelector.append('<option value="" hidden selected>Loading models...</option>');
            $modelSelector.attr('required', true).prop('disabled', false);
            
            $.ajax({
                url: '/get-models-by-brand/' + brandId + '/',
                type: 'GET',
                success: function(response) {
                    if (response.status === 'success' && response.models.length > 0) {
                        $modelSelector.empty();
                        $modelSelector.append('<option value="" hidden selected>Select a model</option>');
                        
                        $.each(response.models, function(index, model) {
                            $modelSelector.append($('<option>', {
                                value: model.name,
                                text: model.name
                            }));
                        });
                        
                        if (selectedModel) {
                            $modelSelector.val(selectedModel);
                        }
                    } else {
                        $modelSelector.empty().append('<option value="" hidden selected>No models found</option>');
                        $modelSelector.removeAttr('required');
                        if (response.message) {
                            console.error('Error fetching models:', response.message);
                        }
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching models:', error);
                    $modelSelector.empty().append('<option value="" hidden selected>Error loading models</option>');
                    $modelSelector.removeAttr('required');
                }
            });
        } else {
            $modelSelector.empty().append('<option value="" hidden selected>Please select a brand first</option>');
            $modelSelector.removeAttr('required');
        }
    }
    
    $brandSelect.on('change', function() {
        loadModelsForBrand($(this).val(), null);
    });
    
    // Initialize model selector - will be called from HTML with proper values
    window.initializeModelSelector = function(initialBrandId, initialModel) {
        if (initialBrandId) {
            loadModelsForBrand(initialBrandId, initialModel);
        }
    };
    
    var initialBrandId = $brandSelect.val();
    if (initialBrandId) {
        loadModelsForBrand(initialBrandId, null);
    }
    
    var $discountAmount = $('#discount_amount');
    var $discountPercent = $('#discount_percent');
    var $purchasePrice = $('#purchase_price');
    var $price = $('#price');
    var $priceError = $('#price-error');
    
    var initialPercent = parseFloat($discountPercent.val()) || 0;
    var initialPurchasePrice = parseFloat($purchasePrice.val()) || 0;
    if (initialPercent > 0 && initialPurchasePrice > 0) {
        var initialAmount = (initialPurchasePrice * initialPercent) / 100;
        $discountAmount.val(initialAmount.toFixed(2));
    }
    
    // Check initial state for readonly
    updatePurchasePriceIfNeeded();
    
    function updateDiscountPercent() {
        var amount = parseFloat($discountAmount.val()) || 0;
        var mrp = parseFloat($price.val()) || 0;
        if (mrp > 0) {
            if (amount > mrp) {
                amount = mrp;
                $discountAmount.val(amount.toFixed(2));
            }
            var percent = (amount / mrp) * 100;
            $discountPercent.val(percent.toFixed(2));
            updatePurchasePriceIfNeeded();
        }
    }
    
    function updateDiscountAmount() {
        var percent = parseFloat($discountPercent.val()) || 0;
        var mrp = parseFloat($price.val()) || 0;
        
        if (percent > 100) {
            percent = 100;
            $discountPercent.val(percent.toFixed(2));
        }
        
        var amount = (mrp * percent) / 100;
        $discountAmount.val(amount.toFixed(2));
        updatePurchasePriceIfNeeded();
    }
    
    function updatePurchasePriceIfNeeded() {
        var mrp = parseFloat($price.val()) || 0;
        var discount = parseFloat($discountPercent.val()) || 0;
        var gst = parseFloat($('#gst').val()) || 0;
        var includeGst = $('#price_includes_gst').is(':checked');
        
        if (mrp > 0 && discount > 0) {
            var baseMrp = includeGst ? mrp / (1 + gst / 100) : mrp;
            var purchasePrice = baseMrp - ((baseMrp * discount) / 100);
            $purchasePrice.prop('readonly', true).val(purchasePrice.toFixed(2));
        } else {
            $purchasePrice.prop('readonly', false);
        }
    }
    
    function validatePricing() {
        var mrp = parseFloat($price.val()) || 0;
        var discount = parseFloat($discountPercent.val()) || 0;
        var purchasePrice = parseFloat($purchasePrice.val()) || 0;
        var gst = parseFloat($('#gst').val()) || 0;
        var includeGst = $('#price_includes_gst').is(':checked');
        
        if (mrp <= 0) {
            $priceError.text('MRP must be greater than 0').show();
            $price.addClass('is-invalid');
            return false;
        }
        
        if (discount > 0) {
            var baseMrp = includeGst ? mrp / (1 + gst / 100) : mrp;
            var expectedPurchasePrice = baseMrp - ((baseMrp * discount) / 100);
            
            if (expectedPurchasePrice < 0) {
                $priceError.text('Discount cannot exceed base MRP').show();
                $price.addClass('is-invalid');
                return false;
            }
            
            if (Math.abs(purchasePrice - expectedPurchasePrice) > 0.01) {
                $priceError.text(`Purchase price should be ${expectedPurchasePrice.toFixed(2)} (Base MRP - Discount)`).show();
                $price.addClass('is-invalid');
                return false;
            }
        }
        
        $priceError.hide();
        $price.removeClass('is-invalid');
        return true;
    }
    
    $discountAmount.on('input', updateDiscountPercent);
    $discountPercent.on('input', updateDiscountAmount);
    $price.on('input', function() {
        updateDiscountAmount();
        updatePurchasePriceIfNeeded();
        validatePricing();
    });
    
    $discountPercent.on('input', validatePricing);
    $discountAmount.on('input', validatePricing);
    $price.on('input', validatePricing);
    $('#gst').on('input', function() {
        updatePurchasePriceIfNeeded();
        validatePricing();
    });
    $('#price_includes_gst').on('change', function() {
        updatePurchasePriceIfNeeded();
        validatePricing();
    });
    
    $form.on('submit', function(e) {
        if (!this.checkValidity() || !validatePricing()) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('was-validated');
            return false;
        }
    });
});