$(function () {
    function getCurrentTime() {
        var date = new Date();
        //var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        var currentTimeFormat = date.getHours() + 'h' + date.getMinutes()
        return currentTimeFormat;
    }

    var userIds = {};
    var currentCustomerId = null;

    var firstTime = true;


    // Declare a proxy to reference the hub.
    var chat = $.connection.chatHub;
    function restoreData() {
        if (firstTime) {
            var db = localStorage.getItem('db');
            if (db) {
                var data = JSON.parse(db);
                chat.server.getCustomerIds().done(function (rs) {
                    console.log(rs);
                })
            }
        }
    }

    function receive(connectId, name, message) {
        console.log('receive is call')
        if (userIds.hasOwnProperty(connectId)) {
            userIds[connectId].push({ type: 'customer', name: name, message: message, time: getCurrentTime() });
            $('div[data-customer-id="' + connectId + '"] p').text(message);

            if (currentCustomerId == null) {

            }
            if (currentCustomerId == connectId) {
                addMessageCustomer(message,getCurrentTime());
            }
        } else {
            userIds[connectId] = [{ type: 'customer', name: name, message: message, time: getCurrentTime() }];
            addCustomer(connectId, name, message,getCurrentTime());
        }
    }

    function remove(connectId) {
        $('div[data-customer-id="' + connectId + '"]').remove();
        delete userIds[connectId];
        if (currentCustomerId == connectId) {
            $('.msg_history').empty();
        }
    }
    function connectSignalR(auth) {
        var chat = $.connection.chatHub;
        chat.client.receive = receive

        chat.client.remove = remove;

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
                restoreData();
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

    function handlerSend() {
        if (currentCustomerId == null) {
            alert('Chọn khách hàng trước khi gửi tin nhắn');
        } else {
            var write_msg = $('.write_msg');
            var message = write_msg.val();
            if (!($.trim(message) == '')) {
                write_msg.val('');
                chat.server.sendToCustomer(currentCustomerId, message);
                userIds[currentCustomerId].push({ type: 'admin', name: 'admin', message: message, time: getCurrentTime() })
                addMessageAdmin(message,getCurrentTime())
            }
        }
    }

    $('.msg_send_btn').click(handlerSend)

    $('.write_msg').on('keypress', function (e) {
        if (e.which === 13) {
            handlerSend()
        }
    });



    function addCustomer(connectId, name, message, time) {
        $(".inbox_chat").append('<div data-customer-id="' + connectId + '" class="chat_list"> ' +
                    '  <div class="chat_people"> ' +
                    '      <div class="chat_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div> ' +
                    '    <div class="chat_ib"> ' +
                    '        <h5> ' + name + ' <span class="chat_date">' + time + '</span></h5> ' +
                    '       <p> ' +
                          message +
                    '       </p>' +
                    '    </div> ' +
                    '  </div>' +
                    '  </div>');

        $('.inbox_chat .chat_list').click(function () {
            $(this).addClass('active_chat').siblings().removeClass('active_chat');
            temp = $(this).attr('data-customer-id');
            if (temp != currentCustomerId) {
                $('.msg_history').empty();
                currentCustomerId = temp;
                var listMesss = userIds[connectId];
                for (var i = 0; i < listMesss.length; i++) {
                    mess = listMesss[i];
                    if (mess.type === 'customer') {
                        addMessageCustomer(mess.message,mess.time);
                    } else {
                        addMessageAdmin(mess.message,mess.time);
                    }
                }
            }
        });

    }

    function addMessageCustomer(message,time) {
        $(".msg_history").append('<div class="incoming_msg"> ' +
                           ' <div class="incoming_msg_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div> ' +
                           ' <div class="received_msg"> ' +
                           '     <div class="received_withd_msg"> ' +
                           '         <p>' + message + '</p> ' +
                          '          <span class="time_date">'+ time +'</span> ' +
                           '     </div> ' +
                          '  </div> ' +
                       ' </div>').scrollTop(1000000);
    }

    function addMessageAdmin(message,time) {
        $(".msg_history").append('<div class="outgoing_msg"> ' +
                           ' <div class="sent_msg"> ' +
                           '     <p>' + message + '</p> ' +
                          '      <span class="time_date">'+time+'</span> ' +
                          '  </div> ' +
                       ' </div>').scrollTop(1000000);
    }


})