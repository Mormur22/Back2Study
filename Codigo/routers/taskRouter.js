"use strict";

const express = require("express");

const taskRouter = express.Router();

const multer = require("multer");
const controllerU = require("../controllers/userController");
const controllerUsuario = new controllerU();
const controllerTareas = new require("../controller/taskController")();
const multerFactory = multer({ storage: multer.memoryStorage() });

//Validar
const { check, validationResult } = require("express-validator"); // https://www.youtube.com/watch?v=hBETsBY3Hlg

taskRouter.get("/taskList", controllerUsuario.usuarioLogeado, controllerTareas.listarTareas);

// Falta hacer el post de tarea manual
taskRouter.get("/tasks", controllerUsuario.usuarioLogeado, controllerTareas.añadirTareaManual);

taskRouter.get("/addTask", cU.usuarioLogeado, cT.getTareas);

module.exports = taskRouter;