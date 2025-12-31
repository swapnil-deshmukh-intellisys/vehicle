function deleteConfirmation(data, ajaxUrl) {
    if (!data.id || data.id.length === 0) {
        toastr['warning']('Please select an item', 'WARNING', {
            closeButton: true,
            tapToDismiss: false,
            progressBar: true,
            showMethod: 'fadeIn',
            hideMethod: 'fadeOut',
            timeOut: 2000
        });
    } else {
        Swal.fire({
            title: '<h4 class="card-title mb-25">Are you sure?</h4>',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            customClass: {
                confirmButton: 'btn btn-sm btn-success',
                cancelButton: 'btn btn-sm btn-secondary'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: ajaxUrl,
                    method: "POST",
                    data: data,
                    success: function(response) {
                        const toastrType = response.status ? 'success' : 'error';
                        toastr[toastrType](response.message, toastrType.toUpperCase(), {
                            closeButton: true,
                            tapToDismiss: false,
                            progressBar: true,
                            showMethod: 'fadeIn',
                            hideMethod: 'fadeOut',
                            timeOut: 2000,
                            onHidden: function() {
                                location.reload();
                            }
                        });
                    },
                    error: function() {
                        toastr['error']('Failed to delete', 'ERROR', {
                            closeButton: true,
                            tapToDismiss: false,
                            progressBar: true,
                            showMethod: 'fadeIn',
                            hideMethod: 'fadeOut',
                            timeOut: 2000
                        });
                    }
                });
            }
        });
    }
}