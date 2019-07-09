$(function () {
    function getCurrentTime() {
        var date = new Date();
        //var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        var minute = date.getMinutes();
        if (minute < 10)
            minute = '0' + minute.toString();
        var currentTimeFormat = date.getHours() + 'h' + date.getMinutes() // 8h08
        return currentTimeFormat;
    }

    var userIds = {};
    var currentCustomerId = null;

    var startSave = false;

    function autoSaveData() {
        setInterval(function () {
            if (startSave) {
                var db = JSON.stringify(userIds);
                localStorage.setItem('adminDb', db);
            }
        }, 1000)
    }

    function updateDisplay() {
        for (var customerId in userIds) {
            if (!userIds.hasOwnProperty(customerId)) continue;

            var message = userIds[customerId];

            var messageLength = message.length;
            addCustomer(customerId, message[messageLength - 1].name, message[messageLength - 1].message, message[messageLength - 1].time);
        }
    }

    // Declare a proxy to reference the hub.
    var chat = $.connection.chatHub;
    function restoreData() {
        var db = localStorage.getItem('adminDb');
        if (db) {
            var data = JSON.parse(db);
            chat.server.getCustomerSessionIds().done(function (rs) {
                for (var key in data) {
                    if (!data.hasOwnProperty(key)) continue;
                    if (rs.indexOf(key) != -1) {
                        userIds[key] = data[key];
                    }
                }
                updateDisplay();
            })
        }
        startSave = true;
       

    }

    function receive(connectId, name, message, time) {
        console.log('receive is call')
        if (time == undefined || time == null) {
            time = getCurrentTime();
        }
        if (userIds.hasOwnProperty(connectId)) {
            userIds[connectId].push({ type: 'customer', name: name, message: message, time: time });
            $('div[data-customer-id="' + connectId + '"] .disconnect-notify').text("");
            $('div[data-customer-id="' + connectId + '"] .chat_ib p').text(message);

            if (currentCustomerId == null) {

            }
            if (currentCustomerId == connectId) {
                addMessageCustomer(message, time);
            }
        } else {
            userIds[connectId] = [{ type: 'customer', name: name, message: message, time: time }];
            addCustomer(connectId, name, message, time);
        }
    }

    function disconnect(connectId) {
        //$('div[data-customer-id="' + connectId + '"]').remove();
        //delete userIds[connectId];
       // if (currentCustomerId == connectId) {
       //     $('.msg_history').empty();
        //}
        $('div[data-customer-id="' + connectId + '"] .disconnect-notify').text('Người dùng mất kết nối');
    }

    function remove(connectId) {
        $('div[data-customer-id="' + connectId + '"]').remove();
        delete userIds[connectId];
         if (currentCustomerId == connectId) {
             $('.msg_history').empty();
             currentCustomerId = null;
             $('#customer-name').text('');
        }
    }
    function connectSignalR(auth) {
        var chat = $.connection.chatHub;
        chat.client.receive = receive

        chat.client.disconnect = disconnect;

        chat.client.remove = remove;

        $.connection.hub.qs = { "access_token": auth };

        $.connection.hub.start().done(function () {
            console.log("ket noi xong")
            restoreData();
            autoSaveData();
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

    function handlerSend() {
        if (currentCustomerId == null) {
            alert('Chọn khách hàng trước khi gửi tin nhắn');
        } else {
            var write_msg = $('.write_msg');
            var message = write_msg.val();
            if (!($.trim(message) == '')) {
                write_msg.val('');
                if ($('div[data-customer-id="' + currentCustomerId + '"] .disconnect-notify').text() == 'Người dùng mất kết nối') {
                    alert('Người dùng này đã mất kết nối');
                    return;
                }
                 
                chat.server.sendToCustomer(currentCustomerId, message);
                userIds[currentCustomerId].push({ type: 'admin', name: 'admin', message: message, time: getCurrentTime() })
                addMessageAdmin(message, getCurrentTime())
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
        if ($('div[data-customer-id="' + connectId + '"]').length != 0)
            return;
        $(".inbox_chat").append('<div data-customer-id="' + connectId + '" class="chat_list"> ' +
                    '  <div class="chat_people"> ' +
                    '      <div class="chat_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div> ' +
                    '    <div class="chat_ib"> ' +
                    '        <h5> ' + name + ' <span class="chat_date">' + time + '</span></h5> ' +
                    '       <p> ' +
                          message +
                    '       </p>' +
                    '    </div> ' +
                    '  </div> ' +
                    ' <span class="disconnect-notify" ></span>' +
                    '  </div>');

        $('.inbox_chat .chat_list').click(function () {
            $(this).addClass('active_chat').siblings().removeClass('active_chat');
            temp = $(this).attr('data-customer-id');
            if (temp != currentCustomerId) {
                $('.msg_history').empty();
                currentCustomerId = temp;
                $('#customer-name').text(userIds[currentCustomerId][0].name);
                var listMesss = userIds[connectId];
                for (var i = 0; i < listMesss.length; i++) {
                    mess = listMesss[i];
                    if (mess.type === 'customer') {
                        addMessageCustomer(mess.message, mess.time);
                    } else {
                        addMessageAdmin(mess.message, mess.time);
                    }
                }
            }
        });

    }

    function addMessageCustomer(message, time) {
        $(".msg_history").append('<div class="incoming_msg"> ' +
                            
                           //' <div class="incoming_msg_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div> ' +
                           ' <div class="received_msg"> ' +
                           '     <div class="received_withd_msg"> ' +
                           '         <p>' + message + '</p> ' +
                          '          <span class="time_date">' + time + '</span> ' +
                           '     </div> ' +
                          '  </div> ' +
                       ' </div>').scrollTop(1000000);
    }

    function addMessageAdmin(message, time) {
        $(".msg_history").append('<div class="outgoing_msg"> ' +
                           ' <div class="sent_msg"> ' +
                           '     <p>' + message + '</p> ' +
                          '      <span class="time_date">' + time + '</span> ' +
                          '  </div> ' +
                       ' </div>').scrollTop(1000000);
    }


})