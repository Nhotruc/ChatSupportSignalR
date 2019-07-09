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
        private static string adminId = "";

        private static Dictionary<string, List<Message>> queueMessage = new Dictionary<string, List<Message>>();
        //private static List<UserConnect> listUserConnect = new List<UserConnect>();
        private static Dictionary<string, HashSet<string>> customerSessionIds = new Dictionary<string, HashSet<string>>();

        public void sendToAdmin(string idSession, string name, string message)
        {
            Debug.WriteLine("sendToAdmin is call");
            Debug.WriteLine("Adminid " + adminId);
            HashSet<string> connectIds = customerSessionIds[idSession];
            foreach (var connectId in connectIds)
            {
                if (connectId != Context.ConnectionId)
                    Clients.Client(connectId).receive("customer", message);
            }
            if (string.IsNullOrEmpty(adminId))
            {
                List<Message> messages = null;
                if (queueMessage.ContainsKey(idSession))
                {
                    messages = queueMessage[idSession];
                }
                else
                {
                    messages = new List<Message>();
                    queueMessage.Add(idSession, messages);
                }
                messages.Add(new Message { type = "customer", name = name, message = message, time = DateTime.Now.ToString("h:mm") });
            }
            else
            {
                Debug.WriteLine("Admin id k null");
                Clients.Client(adminId).receive(idSession, name, message);

            }
        }

        public void sendToCustomer(string idSession, string message)
        {
            Debug.WriteLine("sendToCustomer is call");
            if (!customerSessionIds.ContainsKey(idSession)) return;

            HashSet<string> connectIds = customerSessionIds[idSession];
            foreach (var connectId in connectIds)
            {
                Clients.Client(connectId).receive("admin", message);
            }
        }

        public void removeIdSession(string idSession)
        {
            Debug.WriteLine("remove Id session is call");
            customerSessionIds.Remove(idSession);
            if (!string.IsNullOrEmpty(adminId))
            {
                Clients.Client(adminId).remove(idSession);
            }
        }

        public List<string> getCustomerSessionIds()
        {
            return customerSessionIds.Keys.ToList();
        }
        public void Connect(string idSession)
        {
            if (string.IsNullOrEmpty(idSession)) return;

            if (customerSessionIds.ContainsKey(idSession))
            {
                customerSessionIds[idSession].Add(Context.ConnectionId);
            }
            else
            {
                HashSet<string> connectIds = new HashSet<string>();
                connectIds.Add(Context.ConnectionId);
                customerSessionIds.Add(idSession, connectIds);
            }
        }
        public override Task OnConnected()
        {
            string token = Context.QueryString["access_token"];
            if (string.IsNullOrEmpty(token))
            {
                Debug.WriteLine("Customer is connect");
                string idSession = Context.QueryString["idSession"];
                if (!string.IsNullOrEmpty(idSession))
                {
                    if (customerSessionIds.ContainsKey(idSession))
                    {
                        customerSessionIds[idSession].Add(Context.ConnectionId);
                    }
                    else
                    {
                        HashSet<string> connectIds = new HashSet<string>();
                        connectIds.Add(Context.ConnectionId);
                        customerSessionIds.Add(idSession, connectIds);
                    }
                }
            }
            else
            {
                adminId = Context.ConnectionId;
                Debug.WriteLine("Admin is connect " + adminId);
                foreach (KeyValuePair<string, List<Message>> item in queueMessage)
                {
                    string customerSessionId = item.Key;
                    List<Message> messages = item.Value;
                    foreach (var message in messages)
                    {
                        Clients.Client(adminId).receive(customerSessionId, message.name, message.message, message.time);
                    }
                }
                queueMessage.Clear();

            }
            return base.OnConnected();
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            string idSession = Context.QueryString["idSession"];
            if (!string.IsNullOrEmpty(idSession) && customerSessionIds.ContainsKey(idSession))
            {
                HashSet<string> connectIds = customerSessionIds[idSession];
                connectIds.Remove(Context.ConnectionId);
                if (connectIds.Count == 0)
                {
                    if (!string.IsNullOrEmpty(adminId))
                    {
                        Clients.Client(adminId).disconnect(idSession);
                    }
                    customerSessionIds.Remove(idSession);
                }
            }

            return base.OnDisconnected(stopCalled);
        }

        public override Task OnReconnected()
        {
            string idSession = Context.QueryString["idSession"];
            if (!string.IsNullOrEmpty(idSession))
            {
                if (customerSessionIds.ContainsKey(idSession))
                {
                    customerSessionIds[idSession].Add(Context.ConnectionId);
                }
                else
                {
                    HashSet<string> connectIds = new HashSet<string>();
                    connectIds.Add(Context.ConnectionId);
                    customerSessionIds.Add(idSession, connectIds);
                }
            }
            return base.OnReconnected();
        }

    }

    public class Message
    {
        public string type { get; set; }
        public string name { get; set; }
        public string message { get; set; }
        public string time { get; set; }
    }

}