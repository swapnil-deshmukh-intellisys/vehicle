$(document).ready(function () {
    var $discountAmount = $('#discount_amount');
    var $discountPercent = $('#discount_percent');
    var $purchasePrice = $('#purchase_price');
    var $rate = $('#rate');
    var $gst = $('#gst');
    var $form = $('#stockInwardForm');
    var $productSelect = $('#stockInwardProductSelect');
    var $quantity = $('input[name="quantity"]');
    var baseRate = 0; // Store the base rate per unit

    // Helper function to highlight text safely
    function highlightMatch(text, term) {
        if (!text) return '';
        if (!term || term.trim() === '') {
            return $('<div>').text(text).html();
        }
        var cleanTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var regex = new RegExp('(' + cleanTerm + ')', 'gi');
        var parts = text.split(regex);
        return parts.map(function (part) {
            if (part.toLowerCase() === term.toLowerCase()) {
                return '<span class="fw-bolder text-primary">' + $('<div>').text(part).html() + '</span>';
            } else {
                return $('<div>').text(part).html();
            }
        }).join('');
    }

    if ($productSelect.length) {
        $productSelect.select2({
            dropdownParent: $('#stockInwardModal'),
            width: '100%',
            templateResult: function (data) {
                if (!data.id) {
                    return data.text;
                }
                var element = $(data.element);
                var partNumber = element.data('part-number') || '';
                var code = element.data('code') || '';

                // Get current search term
                var searchTerm = $('#stockInwardModal .select2-search__field').val() || '';

                var highlightedText = highlightMatch(data.text, searchTerm);
                var partNumberHtml = partNumber ? `Part No: ${highlightMatch(partNumber, searchTerm)}` : '';
                var codeHtml = code ? `Code: ${highlightMatch(code, searchTerm)}` : '';

                var $container = $(
                    `<div class='select2-result-repository clearfix'>
                        <div class='select2-result-repository__title'>${highlightedText}</div>
                        ${(partNumber || code) ?
                        `<div class='select2-result-repository__meta'>
                                <small class='text-muted'>
                                    ${partNumberHtml}
                                    ${(partNumber && code) ? ' | ' : ''}
                                    ${codeHtml}
                                </small>
                            </div>` : ''
                    }
                    </div>`
                );
                return $container;
            },
            matcher: function (params, data) {
                if ($.trim(params.term) === '') {
                    return data;
                }
                if (typeof data.text === 'undefined') {
                    return null;
                }

                var element = $(data.element);
                var partNumber = (element.data('part-number') || '').toString().toLowerCase();
                var code = (element.data('code') || '').toString().toLowerCase();

                var term = params.term.toLowerCase();
                var text = data.text.toLowerCase();

                if (text.indexOf(term) > -1 || partNumber.indexOf(term) > -1 || code.indexOf(term) > -1) {
                    return data;
                }
                return null;
            }
        });
    }

    // Product selection handler
    $productSelect.on('change', function () {
        var productId = $(this).val();
        if (productId) {
            $.ajax({
                url: '/g-inv-current-stock/' + productId + '/',
                method: 'GET',
                success: function (response) {
                    if (response.status) {
                        var product = response.product;
                        // Store base rate and auto-fill form fields
                        baseRate = product.mrp || 0;
                        var quantity = parseFloat($quantity.val()) || 1;
                        $rate.val((baseRate * quantity).toFixed(2));
                        $gst.val(product.gst || '18');
                        $discountPercent.val(product.discount || '');

                        // Show product details
                        $('#selected-product-details').show();
                        $('#product-name').text(product.name || '');
                        $('#product-brand').text(product.brand || '');
                        $('#product-code').text(product.code || '');
                        $('#product-category').text(product.category || '');
                        $('#product-part-number').text(product.part_number || '');
                        $('#product-model').text(product.model || '');
                        $('#product-description').text(product.description || '');
                        $('#product-stock').text(product.current_stock || '0');
                        $('#product-mrp').text('MRP / unit: ' + ((product.mrp || 0)).toFixed(2));
                        $('#product-gst').text('GST: ' + (product.gst || '0'));
                        $('#product-discount').text('Discount: ' + (product.discount || '0'));

                        // Trigger calculations
                        updateDiscountAmount();
                        updatePurchasePriceIfNeeded();
                    }
                },
                error: function () {
                    console.error('Failed to fetch product details');
                }
            });
        } else {
            // Hide product details if no product selected
            $('#selected-product-details').hide();
            // Clear form fields
            $rate.val('');
            $gst.val('18');
            $discountPercent.val('');
            $discountAmount.val('');
            $purchasePrice.val('');
        }
    });

    // Initialize calculations when modal opens
    function initializeCalculations() {
        // Only calculate if we have values
        if ($rate.val() && $discountPercent.val()) {
            updateDiscountAmount();
        }
        if ($rate.val()) {
            updatePurchasePriceIfNeeded();
        }
    }

    // Listen for modal show event
    $('#stockInwardModal').on('shown.bs.modal', function () {
        // If a product is already selected (page-driven selection like r-current-stock),
        // try to set baseRate from available data so quantities calculate correctly.
        var selectedProductId = $productSelect.val();
        if (selectedProductId) {
            // Prefer global productData (set on r-current-stock page)
            try {
                if (typeof productData !== 'undefined' && productData[selectedProductId]) {
                    var p = productData[selectedProductId];
                    baseRate = parseFloat(p.price) || 0;
                    var quantity = parseFloat($quantity.val()) || 1;
                    $rate.val((baseRate * quantity).toFixed(2));
                    $gst.val(p.gst || $gst.val());
                    $discountPercent.val(p.discount || $discountPercent.val());
                    // Ensure product details area shows correct MRP text
                    $('#product-mrp').text('MRP / unit: ' + (baseRate).toFixed(2));
                    $('#selected-product-details').show();
                } else {
                    // Fallback: parse MRP from the displayed text if present
                    var mrpText = $('#product-mrp').text() || '';
                    var m = mrpText.match(/([0-9]+(?:\.[0-9]+)?)/);
                    if (m) {
                        baseRate = parseFloat(m[1]) || 0;
                        var q = parseFloat($quantity.val()) || 1;
                        $rate.val((baseRate * q).toFixed(2));
                    }
                }
            } catch (e) {
                console.error('Error initializing baseRate from preselected product:', e);
            }
        }

        setTimeout(initializeCalculations, 100);
    });

    // Also initialize on document ready
    initializeCalculations();

    function updateDiscountPercent() {
        var amount = parseFloat($discountAmount.val()) || 0;
        var mrp = parseFloat($rate.val()) || 0;
        var quantity = parseFloat($quantity.val()) || 1;
        var totalMrp = mrp;

        if (totalMrp > 0) {
            if (amount > totalMrp) {
                amount = totalMrp;
                $discountAmount.val(amount.toFixed(2));
            }
            var percent = (amount / totalMrp) * 100;
            $discountPercent.val(percent.toFixed(2));
            updatePurchasePriceIfNeeded();
        }
    }

    function updateDiscountAmount() {
        var percent = parseFloat($discountPercent.val()) || 0;
        var mrp = parseFloat($rate.val()) || 0;
        var quantity = parseFloat($quantity.val()) || 1;

        if (percent > 100) {
            percent = 100;
            $discountPercent.val(percent.toFixed(2));
        }

        var amount = (mrp * percent) / 100;
        $discountAmount.val(amount.toFixed(2));
        updatePurchasePriceIfNeeded();
    }

    function updatePurchasePriceIfNeeded() {
        var mrp = parseFloat($rate.val()) || 0;
        var discount = parseFloat($discountPercent.val()) || 0;
        var gst = parseFloat($gst.val()) || 0;
        var quantity = parseFloat($quantity.val()) || 1;
        var includeGst = $('#price_includes_gst').is(':checked');

        if (mrp > 0) {
            var baseMrp = includeGst ? mrp / (1 + gst / 100) : mrp;
            var purchasePrice = (baseMrp - ((baseMrp * discount) / 100));
            $purchasePrice.val(purchasePrice.toFixed(2));

            if (discount > 0) {
                $purchasePrice.prop('readonly', true);
            } else {
                $purchasePrice.prop('readonly', false);
            }
        } else {
            $purchasePrice.prop('readonly', false).val('');
        }
    }

    function validatePricing() {
        var mrp = parseFloat($rate.val()) || 0;
        var discount = parseFloat($discountPercent.val()) || 0;
        var purchasePrice = parseFloat($purchasePrice.val()) || 0;
        var gst = parseFloat($gst.val()) || 0;
        var includeGst = $('#price_includes_gst').is(':checked');

        if (mrp <= 0) {
            return false;
        }

        if (discount > 0) {
            var baseMrp = includeGst ? mrp / (1 + gst / 100) : mrp;
            var expectedPurchasePrice = baseMrp - ((baseMrp * discount) / 100);

            if (expectedPurchasePrice < 0) {
                return false;
            }

            if (Math.abs(purchasePrice - expectedPurchasePrice) > 0.01) {
                return false;
            }
        }

        return true;
    }

    $quantity.on('input', function () {
        if (baseRate > 0) {
            var quantity = parseFloat($(this).val()) || 1;
            $rate.val((baseRate * quantity).toFixed(2));
        }
        updateDiscountAmount();
        updatePurchasePriceIfNeeded();
    });

    $discountAmount.on('input', updateDiscountPercent);
    $discountPercent.on('input', updateDiscountAmount);
    $rate.on('input', function () {
        updateDiscountAmount();
        updatePurchasePriceIfNeeded();
        validatePricing();
    });

    $discountPercent.on('input', validatePricing);
    $discountAmount.on('input', validatePricing);
    $rate.on('input', validatePricing);
    $gst.on('input', function () {
        updatePurchasePriceIfNeeded();
        validatePricing();
    });
    $('#price_includes_gst').on('change', function () {
        updatePurchasePriceIfNeeded();
        validatePricing();
    });

    $form.on('submit', function (e) {
        e.preventDefault();

        if (!this.checkValidity() || !validatePricing()) {
            e.stopPropagation();
            this.classList.add('was-validated');
            return false;
        }

        $.ajax({
            url: $form.attr('action'),
            method: 'POST',
            data: $form.serialize(),
            success: function (response) {
                $('#stockInwardModal').modal('hide');
                location.reload();
            },
            error: function (xhr, status, error) {
                console.error('Form submission failed:', error);
            }
        });
    });
});