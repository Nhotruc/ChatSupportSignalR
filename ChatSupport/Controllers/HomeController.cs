﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace OAuth2.Controllers
{
    public class HomeController : Controller
    {
        [AllowAnonymous]
        public ActionResult Index()
        {
            if(Session["idSessionConnect"] == null)
                Session["idSessionConnect"] = Guid.NewGuid();
            return View();
        }
    }
}