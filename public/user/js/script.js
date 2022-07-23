function addToCart(prdtId, prdtName) {
    let quantity = document.getElementById("quantity").value
    $.ajax({
        url: '/add_to_cart/' + prdtId + '/' + quantity,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
                $("#myCart").load(location.href + " #myCart");
               
                Swal.fire({
                    icon:'success',
                    position:'bottom-right',
                    text: prdtName + " Added to the Cart \n Quantity: "+quantity ,
                    showConfirmButton: false,
                    timer: 1000
                })
            }
            else{
                location.href='/login'
            }
        }
    })
}