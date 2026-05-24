from app.models.base import Base
from app.models.municipio import Municipio
from app.models.analisis import Analisis
from app.models.usuario import Usuario
from app.models.indice_satelital import IndiceSatelital
from app.models.sensor import Sensor
from app.models.lectura_sensor import LecturaSensor
from app.models.parcela import Parcela
from app.models.conversacion import Conversacion
from app.models.mensaje import Mensaje
from app.models.plan_riego import PlanRiego
from app.models.tarea import Tarea

__all__ = ["Base", "Municipio", "Analisis", "Usuario", "IndiceSatelital", "Sensor", "LecturaSensor", "Parcela", "Conversacion", "Mensaje", "PlanRiego", "Tarea"]
