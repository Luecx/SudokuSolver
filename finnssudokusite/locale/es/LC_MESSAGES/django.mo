��    �      �  �   L        Y   	    c  �   y  h       }  r   �  �   �  �   �  �   |     A     T     Z     c     v     �  	   �     �     �  
   �     �  0   �     $     5     >     L     d  
   l     w     ~     �     �     �     �     �     �     �                    1     A     P     c     s     {     �     �     �     �     �     �     �     �     �     �     �     �  �   �     �     �     �     �     �     �  
   �     �          #  3   +     _     e     r     x     �     �     �  	   �     �     �     �     �     �     �     �     �     �     �          !     &     4  ]   Q     �     �     �     �     �     �          ,     1     >     F     S     [     k     z     �     �     �     �     �     �     �     �     �  
   �     �     �          %     5     :     N     ^     q     y     �     �     �     �     �     �     �     �     �     �     �                    9   4   +   n   e   �       !     !     !     &!     2!     ?!     E!     S!     c!     w!  	   |!  
   �!     �!     �!  9   �!  /   �!     "     "  %   $"  &   J"  '   q"  K   �"     �"  	   �"     �"  	   #  $   #     6#  ,   C#  #   p#  !   �#  "   �#     �#     �#  k  �#  g   d%    �%  �   �)  �   �*  J  %+  s   p,    �,  �   .  �   �.     j/     �/     �/     �/     �/  %   �/     �/     �/  	   0  
   0  '   '0  =   O0     �0     �0     �0     �0     �0  
   �0     �0     �0     1     %1     81     X1     _1     l1     �1     �1     �1     �1     �1     �1     �1     �1     	2     2     (2     12     C2     J2     R2     Z2  	   s2     }2     �2     �2     �2     �2  �   �2     g3     m3     }3     �3     �3     �3  
   �3     �3  "   �3     �3  G   4     K4     S4     e4     u4     �4      �4     �4     �4     �4     �4     �4     �4     5     5      5     &5     .5     >5     ]5     e5     l5  *   �5  u   �5     "6     =6     U6     h6     q6  *   �6     �6     �6     �6     �6     �6     �6      7     7      7     37     97  
   E7     P7     \7     h7     �7     �7     �7     �7     �7     �7     �7     �7     8     8  !   .8      P8     q8     }8     �8     �8     �8     �8     �8     �8     �8     �8     �8     9     $9     69  	   ?9     I9  C   `9  6   �9  �   �9     \:  
   k:  !   v:     �:     �:     �:     �:     �:     �:     �:     �:     	;  '   !;     I;  Z   R;  9   �;     �;     �;  !   �;  %   <  (   C<  p   l<     �<  	   �<     �<  	   =  "   =  	   :=  4   D=      y=  $   �=  '   �=     �=     �=     6   �   �   H   $   [   �   A   �   R   )   S           e   5   I                 |   �   x   �       ^   �          ~      y      N       4   �   �   �      �   F       1   @   m       M   ;   �   h   u   V   �   t   �   d   %   X           �   o      r       s   �       �           �   v   j   n   �   b   D       &       a   #   �   l   "          �      O      J   G           8   �   �   {       U       �   7   .       P      �       _          \       f   `       *   0   w   ]   q      �           �   �      �           �                  �   C   Q   
   Z       '           ,   3   �   K          �   c   �   Y   -   E       (   �   �         p       �   �   i   	   �   L                 �       �   �   +   k         <       �   /              �   >       2   }             =      �          ?   �   �   �   :                           B   g                  !   T       W   �           �   9      �   �   z    
			For a detailed explanation of how the rating is computed, %(link)sclick here</a>.
			 
            <p style="padding:2rem"></p>
            <div style="
                width: 100%%;
                max-width: 600px;
                min-width: 60%%;
                box-sizing: border-box;
                padding: 1rem 4vw 4rem;
                margin: auto;
                border: 1px solid #cccccc;
                border-radius: 3rem;
                background-color: white;
                text-align: center;
            ">
                <img src="https://ndb.one/logo.png" alt="Logo" width="80" height="80" style="display: block; margin: 0 auto;" />
                <p>SUDOKUSPHERE.COM</p>
                <p style="text-align: left; margin-top: 6vh;">
                    Hello %(name)s,<br><br>
                    Thank you for your message to SudokuSphere.<br>
                    We will get back to you as soon as possible.<br><br>
                    Best regards,<br>
                    Finn and the SudokuSphere Team
                </p>
            </div>
            <p style="padding:5rem"></p>
             
        Each time you solve a puzzle, you earn a score \( S_{u,s} \) that reflects both the difficulty of the puzzle and how fast you solved it:
         
        Finally, all user scores are normalized to generate a clean leaderboard from 0 to 100:
         
        Here, \( \bar{t}_s \) is the average time (in seconds) to solve puzzle \( s \), and \( t_{u,s} \) is your time. The logarithmic term models puzzle difficulty (with diminishing returns), while the clamped time ratio rewards speed within bounds.
         
        The closer your performance is to the best in the community, the closer your SPI will be to 100.
         
        The leaderboard now uses the
        <strong>Sudoku Power Index (SPI)</strong> — a score from 0 to 100 that rewards
        <em>fast</em> solves on <em>difficult</em> puzzles and consistent performance as you complete more puzzles.
         
        This setup rewards both quantity and quality: you must solve many puzzles — and solve them well — to reach the top.
         
        Your score \( R_u \) is the <strong>sum</strong> of your scores from the
        <strong>last 100 puzzles</strong> you’ve completed. If you’ve solved fewer, only those count.
          Rotate number pad ABOUT About us Account Activated! Activation Required All Published Sudoku Puzzles All Users Already have an account? Analysis Appearance Auto-remove on input Average solve time for puzzle \(s\) (in seconds) Average time (s) Avg Time Back to Login CHOOSE A PUZZLE TO PLAY CONTACT Candidates Cement Change Password Change password Check Uniqueness Check your inbox! Choose Choose Background Choose Your Preferred Language Choose from Puzzle List Classic Close Completed puzzles Completion Time Create Account Create Your Sudoku Created puzzles Creator Date Completed Deep Design & Settings Easy Expert Extreme FINN'S SUDOKU APP Finish Fontsize Forgot your password? Glow HISTORY Hard Hello %(name)s,

Thank you for your message to SudokuSphere.
We will get back to you as soon as possible.

Best regards,
Finn and the SudokuSphere Team Hello, Highlight Block Highlight Candidates Highlight Column Highlight Numbers Highlight Row Highlights Home How Is Your Rating Calculated? IMPRINT If you didn't request this, just ignore this email. Input Invalid Link LOGIN Last Login: Leaderboard Leaderboard score Leaderboards Let's go! Light Log In Log in Login Logout Meaning Medium Message Message sent Message sent successfully. Minimal Name Name Provided No account yet? Register now No emails are being sent at the moment. Please ask an administrator to activate your account. No puzzles available. No results yet. Normal Depth Numbers Ongoing Puzzles Password Reset Complete Per‑puzzle contribution Play Preparing... Publish Puzzle Check Puzzles Puzzles Created Puzzles Solved Puzzles done Rank Rating Refresh Register Reset Reset Your Password Reset your password Rules Save Sudoku Schließen Search Search by puzzle name... Search by username... Search puzzles: Send Send Finn a message Send reset link Set a New Password Shallow Sign in with... Solid Solved Solved puzzles : Solves Start typing... Stone Sudoku Sudoku Creator Sudoku Leaderboard Sudoku Puzzles Sudoku completed Symbol Tags Thank you for your message Thank you for your message! We will get back to you soon. That activation link is invalid or expired. The weight grows faster for harder puzzles, with base-1.2 logarithmic scaling from 20 seconds upward. Their Rating Thorough Toggle Dropdown Total Score Transparency Ultra Unique Puzzle Unique Solution Uploading Sudoku... User User name User score Username or Email Users We've emailed you instructions for setting your password. Weight examples (based on avg. time in seconds) Wood You can now You don’t have any ongoing puzzles. You haven’t created any puzzles yet. You haven’t finished any puzzles yet. You requested a password reset. Click the link below to set a new password: Your E-Mail Your Name Your Rating Your Time Your account is now active. You can  Your profile Your time to solve puzzle \(s\) (in seconds) doesn’t have any ongoing puzzles. hasn’t created any puzzles yet. hasn’t finished any puzzles yet. log in with your new password. Project-Id-Version: PACKAGE VERSION
Report-Msgid-Bugs-To: 
PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE
Last-Translator: FULL NAME <EMAIL@ADDRESS>
Language-Team: LANGUAGE <LL@li.org>
Language: es
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit
Plural-Forms: nplurals=3; plural=n == 1 ? 0 : n != 0 && n % 1000000 == 0 ? 1 : 2;
 
			Para una explicación detallada de cómo se calcula la puntuación, %(link)shaz clic aquí</a>.
			 
            <p style="padding:2rem"></p>
            <div style="
                width: 100%%;
                max-width: 600px;
                min-width: 60%%;
                box-sizing: border-box;
                padding: 1rem 4vw 4rem;
                margin: auto;
                border: 1px solid #cccccc;
                border-radius: 3rem;
                background-color: white;
                text-align: center;
            ">
                <img src="https://ndb.one/logo.png" alt="Logo" width="80" height="80" style="display: block; margin: 0 auto;" />
                <p>SUDOKUSPHERE.COM</p>
                <p style="text-align: left; margin-top: 6vh;">
                    Hola %(name)s,<br><br>
                    Gracias por tu mensaje a SudokuSphere.<br>
                    Nos pondremos en contacto contigo lo antes posible.<br><br>
                    Un cordial saludo,<br>
                    Finn y el equipo de SudokuSphere
                </p>
            </div>
            <p style="padding:5rem"></p>
             
        Cada vez que resuelves un puzle, obtienes una puntuación \( S_{u,s} \) que
        refleja tanto la dificultad del puzle como la rapidez con la que lo resolviste:
         
        Finalmente, todas las puntuaciones de los usuarios se normalizan para generar una clasificación clara de 0 a 100:
         
        Aquí, \( \bar{t}_s \) es el tiempo medio (en segundos) para resolver
        el puzle \( s \), y \( t_{u,s} \) es tu tiempo. El término logarítmico
        modela la dificultad del puzle (con rendimientos decrecientes), mientras que la proporción de tiempo limitada premia la rapidez dentro de unos límites.
         
        Cuanto más se acerque tu rendimiento al mejor de la comunidad, más cerca estará tu SPI de 100.
         
        La clasificación ahora utiliza el
        <strong>Índice de Potencia Sudoku (SPI)</strong>: una puntuación de 0 a 100 que premia
        las resoluciones <em>rápidas</em> de puzles <em>difíciles</em> y el rendimiento constante a medida que completas más puzles.
         
        Este sistema premia tanto la cantidad como la calidad: debes resolver muchos puzles —y resolverlos bien— para llegar a lo más alto.
         
        Tu puntuación \( R_u \) es la <strong>suma</strong> de tus puntuaciones de los
        <strong>últimos 100 puzles</strong> que has completado. Si has resuelto menos, solo cuentan esos.
          Rotar teclado numérico SOBRE Sobre nosotros ¡Cuenta activada! Activación requerida Todos los puzles de Sudoku publicados Todos los usuarios ¿Ya tienes una cuenta? Análisis Apariencia Eliminar automáticamente al introducir Tiempo medio de resolución para el puzle \(s\) (en segundos) Tiempo medio (s) Tiempo medio Volver al inicio de sesión ELIGE UN PUZLE PARA JUGAR CONTACTO Candidatos Cemento Cambiar contraseña Cambiar contraseña Comprobar unicidad ¡Revisa tu bandeja de entrada! Elegir Elegir fondo Elige tu idioma preferido Elegir de la lista de puzles Clásico Cerrar Puzles completados Tiempo de finalización Crear cuenta Crea tu Sudoku Puzles creados Creador Fecha de finalización Profunda Diseño y ajustes Fácil Experto Extremo LA APP DE SUDOKU DE FINN Finalizar Tamaño de fuente ¿Has olvidado tu contraseña? Brillo HISTORIA Difícil Hola %(name)s,

Gracias por tu mensaje a SudokuSphere.
Nos pondremos en contacto contigo lo antes posible.

Un cordial saludo,
Finn y el equipo de SudokuSphere Hola, Resaltar bloque Resaltar candidatos Resaltar columna Resaltar números Resaltar fila Resaltados Inicio ¿Cómo se calcula tu puntuación? AVISO LEGAL Si no has solicitado esto, simplemente ignora este correo electrónico. Entrada Enlace no válido INICIAR SESIÓN Último acceso: Clasificación Puntuación de la clasificación Clasificaciones ¡Vamos! Ligera Iniciar sesión Iniciar sesión Iniciar sesión Cerrar sesión Significado Media Mensaje Mensaje enviado Mensaje enviado correctamente. Mínima Nombre Nombre proporcionado ¿Aún no tienes cuenta? Regístrate ahora No se están enviando correos electrónicos en este momento. Por favor, pide a un administrador que active tu cuenta. No hay puzles disponibles. Aún no hay resultados. Profundidad normal Números Puzles en curso Restablecimiento de contraseña completado Contribución por puzle Jugar Preparando... Publicar Comprobación del puzle Puzles Puzles creados Puzles resueltos Puzles completados Rango Valoración Actualizar Registrarse Restablecer Restablece tu contraseña Restablece tu contraseña Reglas Guardar Sudoku Cerrar Buscar Buscar por nombre del puzle... Buscar por nombre de usuario... Buscar puzles: Enviar Enviar un mensaje a Finn Enviar enlace de restablecimiento Establecer una nueva contraseña Superficial Iniciar sesión con... Sólida Resuelto Puzles resueltos: Resoluciones Empieza a escribir... Piedra Sudoku Creador de Sudoku Clasificación de Sudoku Puzles de Sudoku Sudoku completado Símbolo Etiquetas Gracias por tu mensaje ¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto. Ese enlace de activación no es válido o ha caducado. El peso crece más rápido para los puzles más difíciles, con una escala logarítmica de base 1,2 a partir de los 20 segundos. Su valoración Exhaustiva Mostrar/ocultar menú desplegable Puntuación total Transparencia Ultra Puzle único Solución única Subiendo Sudoku... Usuario Nombre de usuario Puntuación del usuario Nombre de usuario o correo electrónico Usuarios Te hemos enviado por correo electrónico las instrucciones para establecer tu contraseña. Ejemplos de peso (basados en el tiempo medio en segundos) Madera Ahora puedes No tienes ningún puzle en curso. Todavía no has creado ningún puzle. Todavía no has terminado ningún puzle. Has solicitado restablecer tu contraseña. Haz clic en el enlace de abajo para establecer una nueva contraseña: Tu correo electrónico Tu nombre Tu valoración Tu tiempo Tu cuenta ya está activa. Puedes  Tu perfil Tu tiempo para resolver el puzle \(s\) (en segundos) no tiene ningún puzle en curso. no ha creado ningún puzle todavía. no ha terminado ningún puzle todavía. iniciar sesión con tu nueva contraseña. 