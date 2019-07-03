using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;
using System.Threading.Tasks;
using Microsoft.AspNet.SignalR.Hubs;
using System.Diagnostics;

namespace ChatSupport.signalr.hubs
{
    public class ChatHub : Hub
    {
        private static string adminId="";

        private HashSet<string> customerIds = new HashSet<string>();
        public void sendToAdmin(string name,string message)
        {
            Debug.WriteLine("sendToAdmin is call");
            Debug.WriteLine("Adminid " + adminId);
            if (string.IsNullOrEmpty(adminId))
                Debug.WriteLine("ADmim id bi null");
            else
            {
                Debug.WriteLine("Admin id k null");
            }
            if (!string.IsNullOrEmpty(adminId))
            {
                Clients.Client(adminId).receive(Context.ConnectionId,message);
            }
        }

        public void sendToCustomer(string connectId,string message)
        {
            Debug.WriteLine("sendToCustomer is call");
            if (customerIds.Contains(connectId))
            {
                Clients.Client(connectId).receive(message);
            } else
            {

            }
        }

        public override Task OnConnected()
        {
            string token = Context.QueryString["access_token"];
            if (string.IsNullOrEmpty(token))
            {
                Debug.WriteLine("Customer is connect");
                customerIds.Add(Context.ConnectionId);
            } else
            {
                adminId = Context.ConnectionId;
                Debug.WriteLine("Admin is connect "+adminId);
            }
            return base.OnConnected();
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            if (!string.IsNullOrEmpty(adminId))
            {
                Clients.Client(adminId).remove(Context.ConnectionId);
            }
            customerIds.Remove(Context.ConnectionId);
            return base.OnDisconnected(stopCalled);
        }

        public override Task OnReconnected()
        {
            if (!customerIds.Contains(Context.ConnectionId))
            {
                customerIds.Add(Context.ConnectionId);
            }

            return base.OnReconnected();
        }

    }

}