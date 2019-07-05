using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ChatSupport.signalr.hubs
{
    public class UserConnect
    {
        public string IDSession { get; set; }
        public string IDConnection { get; set; }
    }
}