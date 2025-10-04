import { Routes, Route, Navigate } from 'react-router-dom';
import EvaluationStructurePage from './EvaluationStructurePage';

/**
 * Rutas para el módulo de evaluación
 * HU-USERS-02: Historial y Simulación NO deben existir (removidos)
 */
export default function EvaluationRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="structure" replace />} />
      <Route path="structure" element={<EvaluationStructurePage />} />
    </Routes>
  );
}