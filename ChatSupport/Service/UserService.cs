using OAuth2.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace OAuth2.Service
{
    public class UserService
    {
        public User GetUserByCredentials(string email,string password)
        {
            if(email != "email@domain.com" || password != "123456")
            {
                return null;
            }
            User user = new User { Id = "1", Email = "email@domain.com" , Password = "password", Name = "Huu Vo" };
            if(user != null)
            {
                user.Password = string.Empty;
            }
            return user;
        }
    }
}