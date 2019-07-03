$(function () {
    function connectSignalR(auth) {
        var chat = $.connection.chatHub;
        chat.client.receive = function (connectId, message) {
            console.log('receive is call')
            if (!userIds.hasOwnProperty(connectId)) {
                userIds[connectId] = [{ type: 'client', message: message }];
                $(".inbox_chat").append('<div data-customer-id="' + connectId + '" class="chat_list"> ' +
                    '  <div class="chat_people"> ' +
                    '      <div class="chat_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div> ' +
                    '    <div class="chat_ib"> ' +
                    '        <h5>LinhDepTrai <span class="chat_date">1/7/2019</span></h5> ' +
                    '       <p> ' +
                          message +
                    '       </p>' +
                    '    </div> ' +
                    '  </div>' +
                    '  </div>')
            } else {
                userIds[connectId].push({ type: 'client', message: message });
                $('div[data-customer-id="' + connectId + '"] p').text(message);
            }
        }

        chat.client.remove = function (connectId) {
            $('div[data-customer-id="' + connectId + '"]').remove();
            delete userIds[connectId];
        }

        chat.client.removeCustomer = function (connectId) {

        }

        $.connection.hub.qs = { "access_token": auth };

        $.connection.hub.start().done(function () {
            console.log("ket noi xong")
        });
    }
    function authenticateUser(credentials) {
        var body = {
            grant_type: 'password',
            username: credentials.username,
            password: credentials.password
        };

        $.ajax({
            url: 'http://localhost:60904/token',
            type: 'POST',
            dataType: 'json',
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            /* data: JSON.stringify(body), /* wrong */
            data: body, /* right */
            complete: function (result) {

            },

            success: function (result) {
                console.log("success")
                if (result == null || !result.hasOwnProperty('access_token')) {
                    $("#txtEmailMess").text("Đăng nhập thất bại");
                    return;
                }

                $('#myModal').modal('hide')
                auth = result['access_token'];
                connectSignalR(auth);

            },

            error: function (result) {
                $("#txtEmailMess").text("Đăng nhập thất bại")
            },
        });
        // session.isAuthenticated(true);
        return true;
    }
    $('#myModal').modal({
        backdrop: 'static',
        keyboard: false  // to prevent closing with Esc button (if you want this too)
    })
    $("#myModal").modal('show');

    $("#formLogin").submit(function (e) {
        e.preventDefault();
        authenticateUser({ username: $('#txtEmail').val(), password: $('#txtPassword').val() });
    })

})