"use strict";


const config =require("../js/config");
const mysql = require("mysql");

const pool = mysql.createPool(config.databaseConfig);

const transporter = require("../js/mailer");    // para enviar correos
const jwt = require("jsonwebtoken");    // para crear un link
const JWT_SECRET = "supersecreto";  // esto habria que moverlo a otro sitio tal vez pero de momento funciona

const DaoUsers = require('../js/userDAO');
const users =new DaoUsers(pool);

//Validar
const { check, validationResult } = require("express-validator");

class controllerU{

    usuarioLogeado(request, response, next) {
        if (request.session.id_!== undefined && request.session.mail !== undefined && request.session.userName !== undefined ) {
            response.locals.id_ = request.session.currentId;
            response.locals.mail = request.session.currentUser;
            response.locals.userName = request.session.currentName;
            
            next();
        } else {
            
            response.redirect("/login");
        }
    }

    login(request, response){
        //console.log("CONTROLADOR "+request.body.correo+" "+request.body.password);
        const errors = validationResult(request);
        

        users.login(request.body.correo, request.body.password)
        .then(value => {
            if (value != false){
                request.session.id_=value.id;
                request.session.mail = value.email;
                request.session.userName = value.username;

                response.locals.id_=request.session.id_;
                response.locals.mailID = request.session.mailID;
                response.locals.userName = request.session.userName;

                //console.log("DATOS controller: "+value.id+"/"+value.username+"/"+value.email+"/"+value.password);
                response.render("principal", {  
                                            title: "Inicio de sesión realizado con éxito.", 
                                            nameUser: request.session.userName, 
                                            mailUser: request.session.mail,
                                            tareas: undefined,
                                            deleteId: false });
            }
            else throw "Error en usuario o contraseña."
        })
        .catch(error => {
            response.status(500);
            response.render("login", {  
                    title: "Error", 
                    msgRegistro: error, 
                    tipoAlert: "alert-danger",
                    errores: errors.mapped()});
        });
    }



    cierreSesion(request, response){
        response.status(200);
        request.session.destroy();
        response.redirect("/");
    }

    probando(request, response){
        response.status(200);
        response.render("principal", {  
            title: "Inicio de sesión realizado con éxito", 
            nameUser: request.session.userName, 
            mailUser: request.session.mail,
            tareas: undefined,
            deleteId: false });
    }

    probando2(request, response){
        response.status(200);
        response.render("principal2", {  
            title: "Inicio de sesión realizado con éxito", 
            nameUser: request.session.userName, 
            mailUser: request.session.mail });
        
    }

    registroUsu(request, response)  {
        //console.log("CONTROLADOR registro "+request.body.correo+" "+request.body.password);
        const errors = validationResult(request);
        if (errors.isEmpty()) {
            console.log("SIN ERRORES");
            
            //creamos el usuario con los datos del formulario
            let usuario = {
                correo: request.body.correo,
                nombre: request.body.username,
                pass: request.body.password,
                pass2: request.body.password2,
            };

            users.existeUsuario(usuario)
            .then(value => {
                if (value == false) return users.existeCorreo(usuario);
                else throw "Nombre de Usuario no disponible";
            })
            .then(value => {
                if (value == false) return users.registro(usuario);
                else throw "Ya existe un usuario con ese correo";
            })
            .then(value => {
                if (value){
                    console.log("Registro exitoso.")
                    response.status(200);
                    response.render("login", {  
                                    title: "Registro completado", 
                                    msgRegistro: "Registro completado " + usuario.nombre + ". Ya puedes loguearte.", 
                                    tipoAlert: "alert-success",
                                    errores: errors.mapped()
                    });
                }
                else throw value;
            })
            .catch(error => {
                response.status(500);
                response.render("signup", {     
                                title: "¡Registro erroneo!",
                                errores: errors.mapped(), 
                                msgRegistro: error
                });
            });
        } 
        else {
            console.log("ERRORES!");
            response.status(500);
            response.render("signup", {
                title: "¡Hay Errores!", 
                errores: errors.mapped(), 
                msgRegistro: false});
        }
    }

    sendEmail(request, response){
        users.findUserByEmail(request.body.email, cb_sendEmail);    // buscamos el usuario en la BBDD

        function cb_sendEmail(errors, user){
            if (errors){
                response.render("forgot-password", {}); // falta por hacer
            }
            else{
                if(user){
                    console.log("Enviando correo a: " + request.body.email);
                    const secret = JWT_SECRET + user.password;
                    const payload = {
                        email: request.body.email,
                        id: user.id
                    };
            
                    const token = jwt.sign(payload, secret, {expiresIn: '15m'});

                    request.session.tokenMail = token;

                    response.locals.tokenMail=request.session.tokenMail;

                    const link = `http://localhost:3300/usuarios/reset-password/${user.id}/${token}`; // localhost:3300 hay que cambiarlo por back2study.herokuapp.com cuando este todo listo
                    console.log("Link creado: " + link);
            
                    // send mail with defined transport object
                    let info = transporter.sendMail({
                        from: '"Recuperar contraseña 👻" <back2study.gps@gmail.com>', // sender address
                        to: request.body.email, // list of receivers
                        subject: "Recuperar contraseña ✔", // Subject line
                        html: "<b>Correo enviado desde back2study. <br>Link: " + link + "</b>", // html body
                    });
                }   
            }
        }
    }

    goTochangeEmail(request, response){
        console.log("caaaambiamos paaaas");
        response.status(200);
        //AQUI SE DEBERIA COMPROBAR QUE EL TOKEN QUE SE RECIBE CONICIDE CON EL CREADO GLOBALMENTE
        response.render("change_pass");
    }

    changeEmail(request, response){
        console.log(request.body.pass1+" <<->>  "+ request.body.pass2);
        //  VERIFICAMOS EN ROUTER, que son iguales y tienen la longitud minima, POR TANTO aqui no se hacen esas comprobaciones
        //Aqui comprobamos que no es la antigua contraseña junto con el correo, si lo es debe modificarla si asi lo quiere
        //Si todo va correcto llamamos al metodo del dao modPass que hara el update
        //Finalmente reenviamos a login para que acceda con su nueva contraseña
    }
    
}

module.exports = controllerU;