Lo que si visualiza a continuacion es modelo de datos Prisma definido en el backend

```js
// Prisma schema base - Autenticación (usuarios, password_reset_tokens, tokens_blacklist)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

/// Enumeración de roles de usuario
enum Rol {
  apoderado
  docente
  director
  administrador
}

/// Tabla: usuarios
model Usuario {
  id                    String    @id @default(uuid()) @db.Uuid
  tipo_documento        String
  nro_documento         String    @db.VarChar(20)
  password_hash         String
  rol                   Rol
  nombre                String
  apellido              String
  telefono              String    @db.VarChar(20)
  fecha_creacion        DateTime  @default(now())
  fecha_ultimo_login    DateTime?
  estado_activo         Boolean   @default(true)
  debe_cambiar_password Boolean   @default(false)

  // Relaciones
  resetTokens       PasswordResetToken[]
  blacklistedTokens TokenBlacklist[]

  // Permisos (docente es el receptor del permiso)
  permisosDocentes  PermisoDocente[]
  // Permisos otorgados por este usuario (director)
  permisosOtorgados PermisoDocente[] @relation("PermisoOtorgadoPor")

  // Historial de permisos (docente)
  permisosDocentesLogs  PermisoDocenteLog[]
  // Historial de permisos otorgados por este usuario (director)
  permisosLogsOtorgados PermisoDocenteLog[] @relation("PermisoLogOtorgadoPor")

  // Asignaciones de cursos cuando el usuario es docente
  asignacionesDocente AsignacionDocenteCurso[]

  // Relaciones familiares donde el usuario es apoderado
  relacionesApoderado RelacionesFamiliares[]

  // Registros académicos creados por este usuario
  evaluacionesRegistradas Evaluacion[]
  asistenciasRegistradas  Asistencia[]

  @@unique([tipo_documento, nro_documento], name: "usuarios_documento_unique")
  @@map("usuarios")
}

/// Tabla: password_reset_tokens
model PasswordResetToken {
  id               String   @id @default(uuid()) @db.Uuid
  token            String   @unique
  id_usuario       String   @db.Uuid
  usuario          Usuario  @relation(fields: [id_usuario], references: [id])
  fecha_creacion   DateTime @default(now())
  fecha_expiracion DateTime
  usado            Boolean  @default(false)

  @@index([id_usuario, fecha_creacion], name: "idx_reset_tokens_usuario_fecha")
  @@map("password_reset_tokens")
}

/// Tabla: tokens_blacklist
model TokenBlacklist {
  id             String   @id @default(uuid()) @db.Uuid
  token          String   @unique
  usuario_id     String?  @db.Uuid
  usuario        Usuario? @relation(fields: [usuario_id], references: [id])
  fecha_creacion DateTime @default(now())

  @@map("tokens_blacklist")
}

/// Enumeración de tipos de permiso para docentes
enum PermisoTipo {
  comunicados
  encuestas
}

/// Enumeración de tipo de evaluación
enum EvalTipo {
  unica
  recurrente
}

enum Nivel {
  Inicial
  Primaria
  Secundaria
}

/// Tabla: permisos_docentes (permisos generales por docente y año)
model PermisoDocente {
  id                 String      @id @default(uuid()) @db.Uuid
  docente_id         String      @db.Uuid
  docente            Usuario     @relation(fields: [docente_id], references: [id])
  tipo_permiso       PermisoTipo
  estado_activo      Boolean     @default(true)
  fecha_otorgamiento DateTime    @default(now())
  otorgado_por       String?     @db.Uuid
  otorgante          Usuario?    @relation("PermisoOtorgadoPor", fields: [otorgado_por], references: [id])
  año_academico     Int

  @@unique([docente_id, tipo_permiso, año_academico])
  @@map("permisos_docentes")
}

/// Tabla: historial de cambios de permisos (auditoría)
model PermisoDocenteLog {
  id             String      @id @default(uuid()) @db.Uuid
  docente_id     String      @db.Uuid
  docente        Usuario     @relation(fields: [docente_id], references: [id])
  tipo_permiso   PermisoTipo
  accion         String // "activado" | "desactivado"
  fecha          DateTime    @default(now())
  otorgado_por   String?     @db.Uuid
  otorgante      Usuario?    @relation("PermisoLogOtorgadoPor", fields: [otorgado_por], references: [id])
  año_academico Int

  @@index([docente_id, año_academico])
  @@map("permisos_docentes_log")
}

/// Tabla: nivel_grado (datos maestros)
model NivelGrado {
  id            String  @id @default(uuid()) @db.Uuid
  nivel         Nivel
  grado         String
  descripcion   String?
  estado_activo Boolean @default(true)

  // Relaciones
  cursos       Curso[]
  asignaciones AsignacionDocenteCurso[]
  estudiantes  Estudiante[]

  @@unique([nivel, grado])
  @@map("nivel_grado")
}

/// Tabla: cursos (catálogo por nivel/grado)
model Curso {
  id             String     @id @default(uuid()) @db.Uuid
  nombre         String
  codigo_curso   String     @unique
  nivel_grado_id String     @db.Uuid
  nivel_grado    NivelGrado @relation(fields: [nivel_grado_id], references: [id])
  año_academico Int
  estado_activo  Boolean    @default(true)

  asignaciones AsignacionDocenteCurso[]
  evaluaciones Evaluacion[]

  @@map("cursos")
}

/// Tabla: asignaciones_docente_curso (qué docente enseña qué curso)
model AsignacionDocenteCurso {
  id               String     @id @default(uuid()) @db.Uuid
  docente_id       String     @db.Uuid
  docente          Usuario    @relation(fields: [docente_id], references: [id])
  curso_id         String     @db.Uuid
  curso            Curso      @relation(fields: [curso_id], references: [id])
  nivel_grado_id   String     @db.Uuid
  nivel_grado      NivelGrado @relation(fields: [nivel_grado_id], references: [id])
  año_academico   Int
  fecha_asignacion DateTime
  estado_activo    Boolean    @default(true)

  @@index([docente_id, año_academico, estado_activo])
  @@map("asignaciones_docente_curso")
}

/// Tabla: estructura_evaluacion (componentes definidos por el director)
model EstructuraEvaluacion {
  id                  String   @id @default(uuid()) @db.Uuid
  año_academico      Int
  nombre_item         String
  peso_porcentual     Decimal  @db.Decimal(5, 2)
  tipo_evaluacion     EvalTipo
  orden_visualizacion Int
  estado_activo       Boolean  @default(true)
  fecha_configuracion DateTime @default(now())
  bloqueada           Boolean  @default(true)

  // Relaciones
  evaluaciones Evaluacion[]

  @@index([año_academico, estado_activo])
  @@map("estructura_evaluacion")
}

/// Enumeración de estado de matrícula
enum MatriculaEstado {
  activo
  retirado
  trasladado
}

/// Enumeración de tipo de relación familiar (apoderado principal)
enum RelacionTipo {
  padre
  madre
  apoderado
  tutor
}

/// Tabla: estudiantes
model Estudiante {
  id                String          @id @default(uuid()) @db.Uuid
  codigo_estudiante String          @unique
  nombre            String
  apellido          String
  nivel_grado_id    String          @db.Uuid
  nivel_grado       NivelGrado      @relation(fields: [nivel_grado_id], references: [id])
  año_academico    Int
  estado_matricula  MatriculaEstado @default(activo)

  // Relaciones
  relacionesFamiliares RelacionesFamiliares[]
  evaluaciones         Evaluacion[]
  asistencias          Asistencia[]

  @@index([nivel_grado_id, año_academico])
  @@map("estudiantes")
}

/// Tabla: relaciones_familiares (solo apoderado principal)
model RelacionesFamiliares {
  id               String       @id @default(uuid()) @db.Uuid
  apoderado_id     String       @db.Uuid
  apoderado        Usuario      @relation(fields: [apoderado_id], references: [id])
  estudiante_id    String       @db.Uuid
  estudiante       Estudiante   @relation(fields: [estudiante_id], references: [id])
  tipo_relacion    RelacionTipo
  fecha_asignacion DateTime     @default(now())
  estado_activo    Boolean      @default(true)
  año_academico   Int

  @@index([apoderado_id, estado_activo], name: "idx_relaciones_apoderado")
  @@index([estudiante_id], name: "idx_relaciones_estudiante")
  @@map("relaciones_familiares")
}

//
// Nuevas enumeraciones para Módulo Académico (Semana 5)
//
enum CalificacionLetra {
  AD
  A
  B
  C
}

enum EvalEstado {
  preliminar
  final
}

enum AsistenciaEstado {
  presente
  tardanza
  permiso
  falta_justificada
  falta_injustificada
}

//
// Nuevas tablas: evaluaciones y asistencias
//
model Evaluacion {
  id                       String               @id @default(uuid()) @db.Uuid
  estudiante_id            String               @db.Uuid
  estudiante               Estudiante           @relation(fields: [estudiante_id], references: [id])
  curso_id                 String               @db.Uuid
  curso                    Curso                @relation(fields: [curso_id], references: [id])
  estructura_evaluacion_id String               @db.Uuid
  estructura_evaluacion    EstructuraEvaluacion @relation(fields: [estructura_evaluacion_id], references: [id])
  trimestre                Int
  año_academico           Int
  fecha_evaluacion         DateTime
  calificacion_numerica    Decimal              @db.Decimal(5, 2)
  calificacion_letra       CalificacionLetra
  observaciones            String?
  fecha_registro           DateTime             @default(now())
  estado                   EvalEstado           @default(preliminar)
  registrado_por           String               @db.Uuid
  registrado               Usuario              @relation(fields: [registrado_por], references: [id])

  @@index([estudiante_id, curso_id, trimestre, año_academico], name: "idx_evaluaciones_estudiante_curso")
  @@index([estructura_evaluacion_id, año_academico], name: "idx_evaluaciones_componente")
  @@index([fecha_evaluacion, estado], name: "idx_evaluaciones_fecha_estado")
  @@map("evaluaciones")
}

model Asistencia {
  id             String           @id @default(uuid()) @db.Uuid
  estudiante_id  String           @db.Uuid
  estudiante     Estudiante       @relation(fields: [estudiante_id], references: [id])
  fecha          DateTime
  estado         AsistenciaEstado
  // HH:MM (24h) opcional solo si estado = tardanza. Se maneja validación en aplicación.
  hora_llegada   String?          @db.VarChar(5)
  justificacion  String?
  año_academico Int
  registrado_por String           @db.Uuid
  registrado     Usuario          @relation(fields: [registrado_por], references: [id])
  fecha_registro DateTime         @default(now())

  @@index([estudiante_id, fecha, año_academico], name: "idx_asistencias_estudiante_fecha")
  @@index([estado, fecha], name: "idx_asistencias_estado_fecha")
  @@index([fecha, año_academico], name: "idx_asistencias_fecha_anio")
  @@map("asistencias")
}
```