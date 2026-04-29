# W-Edu — Roadmap de Implementação

## Status Atual
**Fase:** 2 — Voz com Professor IA (em andamento)  
**Última atualização:** 2026-04-29

---

## Fases

### ✅ Fase 0 — Planejamento
- [x] Definição de escopo
- [x] Arquitetura macro (W-Edu ↔ BeVox ↔ W-Matrix)
- [x] Stack escolhida: FastAPI + PostgreSQL + Next.js
- [x] Entidades principais definidas
- [x] Estrutura de pastas criada
- [x] Repositório inicializado

---

### ✅ Fase 1 — Fundação

**Backend (FastAPI)** ✅
- [x] Setup do projeto (estrutura de pastas, requirements.txt)
- [x] Core: config (pydantic-settings), database (SQLAlchemy), security (JWT/bcrypt)
- [x] Models: Student, Course, Lesson, Enrollment, Progress, Session, Attendance
- [x] Schemas Pydantic: request/response por entidade
- [x] Repositories: data access isolado por entidade
- [x] Services: business logic isolada (auth, student, course, lesson, enrollment, progress, session)
- [x] Routers: auth, students, courses, lessons, enrollments, progress, sessions, webhooks
- [x] Alembic: migration inicial com todas as tabelas
- [x] Testes básicos de API (18 cenários: CRUD, auth, erros, webhook)

**Frontend (Next.js)** ✅
- [x] Setup do projeto (Next.js 16, Tailwind v4, TypeScript — mesmo padrão W-Omni)
- [x] Tela de login (email + senha, JWT, painel direito decorativo)
- [x] Dashboard do aluno (stats, cursos matriculados, últimas sessões)
- [x] Tela de cursos (catálogo + matrícula)
- [x] Tela de curso (lista de aulas + barra de progresso)
- [x] Tela de aula (conteúdo + botão "Falar com professor" + marcar concluída)
- [x] Tela de progresso (counters + lista)
- [x] Tela de sessões (histórico + transcrições expansíveis)
- [x] Build sem erros
- [x] Admin com CRUD de cursos, aulas e alunos
- [x] Deploy em produção (Ubuntu + systemd + nginx)
- [x] Login funcionando em produção

---

### ⬜ Fase 2 — Voz com Professor IA

**Integração BeVox**
- [ ] Endpoint: iniciar sessão de voz (POST /sessions)
- [ ] Botão "Falar com professor" no frontend
- [ ] Webhook BeVox → W-Edu (recebe fim de sessão)
- [ ] Registro automático de presença via webhook
- [ ] Armazenamento de transcrição da sessão

**Integração W-Matrix**
- [ ] Configuração de agente professor por curso
- [ ] Passagem de contexto da aula para o agente
- [ ] Recebimento de feedback do agente ao W-Edu

---

### ⬜ Fase 3 — Progresso e Avaliação

- [ ] Progresso automático via sessões concluídas
- [ ] Avaliação do aluno pelo agente IA durante a conversa
- [ ] Dashboard de progresso por curso
- [ ] Histórico de sessões com transcrições
- [ ] Relatório do professor (visão geral da turma)

---

## Decisões de Arquitetura

| Decisão | Escolha | Motivo |
|---|---|---|
| Backend | FastAPI (Python) | Mesmo padrão do W-Matrix, fácil integração |
| Frontend | Next.js | Mesmo padrão do BeVox frontend |
| Banco | PostgreSQL | Padrão do ecossistema |
| Cache/Filas | Redis | Padrão do ecossistema |
| Auth | JWT | Stateless, compatível com os demais serviços |
| Porta backend | 8000 | Padrão produção |
| Porta frontend | 3000 | Padrão produção |

## Integrações Externas

| Serviço | URL | Finalidade |
|---|---|---|
| BeVox | http://localhost:8001 | Sessões de voz |
| W-Matrix | http://localhost:8000 | Agente professor IA |

---

## Entidades do Banco

```
students        id, name, email, password_hash, created_at
courses         id, name, description, agent_id (W-Matrix), created_at
lessons         id, course_id, title, content, order, type (text/video/voice)
enrollments     id, student_id, course_id, enrolled_at
progress        id, student_id, lesson_id, status (pending/in_progress/done), updated_at
sessions        id, student_id, lesson_id, bevox_session_id, transcript, started_at, ended_at
attendance      id, student_id, lesson_id, session_id, recorded_at
```
