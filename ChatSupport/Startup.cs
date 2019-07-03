using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(ChatSupport.Startup))]
namespace ChatSupport
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
