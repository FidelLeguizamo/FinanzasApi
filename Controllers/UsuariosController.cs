using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanzasApi.Data;
using FinanzasApi.Models;
using System.Text.Json.Serialization;

namespace FinanzasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsuariosController(AppDbContext context)
        {
            _context = context;
        }

        
        [HttpPost]
        public async Task<IActionResult> RegistrarUsuario([FromBody] RegistroRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Contrasenia))
            {
                return BadRequest("Parámetros inválidos enviados desde el cliente.");
            }

            try
            {
              
                bool existeEmail = await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
                if (existeEmail)
                {
                    return BadRequest("El correo electrónico ya se encuentra registrado.");
                }

                var nuevoUsuario = new Usuario
                {
                    Nombre = request.Nombre,
                    Email = request.Email,
                    Contrasenia = request.Contrasenia
                };

                _context.Usuarios.Add(nuevoUsuario);
                await _context.SaveChangesAsync();

                return Ok(nuevoUsuario);
            }
            catch (Exception ex)
            {
               
                var errorDetallado = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Error en Base de Datos: {errorDetallado}");
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Contrasenia))
            {
                return BadRequest("Campos requeridos vacíos.");
            }

            try
            {
                var usuarioValido = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.Contrasenia == request.Contrasenia);

                if (usuarioValido == null)
                {
                    return Unauthorized("Credenciales incorrectas.");
                }

                return Ok(usuarioValido);
            }
            catch (Exception ex)
            {
                var errorDetallado = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Error en Base de Datos al Loguear: {errorDetallado}");
            }
        }
    }

    public class RegistroRequest
    {
        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("contrasenia")]
        public string Contrasenia { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("contrasenia")]
        public string Contrasenia { get; set; } = string.Empty;
    }
}