# W-Edu — Roadmap de Implementacao

## Status Atual

**Fase:** 2 — Voz com Professor IA (em andamento)  
**Ultima atualizacao:** 2026-04-30

## Visao Alvo

O W-Edu deve evoluir de LMS com professor IA para uma plataforma educacional hibrida, capaz de operar cursos online, presenciais e hibridos com trilhas, turmas, agenda, presenca, avaliacoes, certificacao, comunicacao via W-Omni, financeiro, documentos e analytics.

Documento de referencia: [docs/PLATFORM_TARGET.md](docs/PLATFORM_TARGET.md)

## Estado Atual do Produto

### Ja existe

- Autenticacao JWT.
- Alunos e administrador.
- Cursos.
- Aulas.
- Matriculas.
- Progresso.
- Sessoes de voz.
- Presenca basica vinculada a aula/sessao.
- Quiz por aula.
- Admin basico de cursos, aulas e alunos.
- Frontend Next.js com dashboard, cursos, aulas, progresso e sessoes.

### Lacunas principais

- Falta separar curso, modulo, trilha, turma e encontro.
- Falta modelar instrutor, coordenador, empresa e perfis detalhados.
- Falta agenda academica com vagas, lista de espera, salas e unidades.
- Falta presenca presencial com QR Code e regras de validacao.
- Certificacao automatica e validacao publica de certificado implementadas no backend.
- Falta comunicacao por eventos e integracao W-Omni.
- Falta financeiro, documentos, relatorios e analytics.
- Falta arquitetura modular com fronteiras claras para futura separacao em microservicos.

---

## Fases

### Fase 0 — Planejamento

- [x] Definicao de escopo.
- [x] Arquitetura macro W-Edu, BeVox e W-Matrix.
- [x] Stack escolhida: FastAPI, PostgreSQL e Next.js.
- [x] Entidades principais iniciais definidas.
- [x] Estrutura de pastas criada.
- [x] Repositorio inicializado.

### Fase 1 — Fundacao

Backend:

- [x] Setup do projeto.
- [x] Core: config, database e security.
- [x] Models: Student, Course, Lesson, Enrollment, Progress, Session, Attendance.
- [x] Schemas Pydantic.
- [x] Repositories.
- [x] Services.
- [x] Routers.
- [x] Alembic.
- [x] Testes basicos de API.

Frontend:

- [x] Setup Next.js, Tailwind e TypeScript.
- [x] Login.
- [x] Dashboard do aluno.
- [x] Catalogo de cursos.
- [x] Detalhe do curso.
- [x] Tela de aula.
- [x] Tela de progresso.
- [x] Tela de sessoes.
- [x] Admin com CRUD de cursos, aulas e alunos.
- [x] Build sem erros.
- [x] Deploy em producao.

### Fase 2 — Voz com Professor IA

Integracao BeVox:

- [ ] Endpoint: iniciar sessao de voz.
- [ ] Botao "Falar com professor" no frontend.
- [ ] Webhook BeVox para receber fim de sessao.
- [ ] Registro automatico de presenca via webhook.
- [ ] Armazenamento de transcricao da sessao.

Integracao W-Matrix:

- [ ] Configuracao de agente professor por curso.
- [ ] Passagem de contexto da aula para o agente.
- [ ] Recebimento de feedback do agente ao W-Edu.

### Fase 3 — Reorganizacao do Dominio Academico

Objetivo: preparar a base correta antes de crescer funcionalidades.

- [ ] Separar `User` de `Student` ou renomear o modelo atual para usuario com perfis.
- [x] Adicionar papeis: aluno, instrutor, coordenador, gestor empresa e admin.
- [x] Criar empresas B2B.
- [x] Expandir curso com modalidade: online, presencial e hibrido.
- [x] Criar modulos de curso.
- [x] Expandir aulas com tipos: texto, video, PDF, live, presencial, voz e avaliacao.
- [x] Criar trilhas de aprendizagem.
- [x] Criar pre-requisitos entre cursos.
- [ ] Criar regras de conclusao por curso.
- [ ] Ajustar frontend/admin para novo modelo.

Entidades esperadas:

```text
users
organizations
student_profiles
instructor_profiles
courses
course_modules
lessons
learning_paths
learning_path_courses
course_prerequisites
completion_rules
```

### Fase 4 — Turmas, Agenda e Presencial

Objetivo: transformar presencial em capacidade nativa da plataforma.

- [x] Criar unidades/locais.
- [x] Criar salas com capacidade.
- [x] Criar recursos de sala/equipamento.
- [x] Criar turmas por curso, periodo, instrutor, sala, vagas e status.
- [x] Criar inscricao em turma separada de matricula em curso.
- [x] Criar lista de espera.
- [x] Criar encontros presenciais e lives agendadas.
- [x] Criar presenca presencial por encontro.
- [x] Implementar check-in por QR Code.
- [x] Preparar interface para biometria/facial futura.

Entidades esperadas:

```text
locations
rooms
room_resources
instructor_availability
classes
class_enrollments
waitlist_entries
scheduled_meetings
attendance_records
checkin_tokens
```

### Fase 5 — Progresso, Avaliacao e Certificacao

- [ ] Progresso automatico via sessoes concluidas.
- [ ] Avaliacao do aluno pelo agente IA durante a conversa.
- [ ] Dashboard de progresso por curso.
- [ ] Historico de sessoes com transcricoes.
- [ ] Relatorio do professor com visao geral da turma.
- [ ] Avaliacao hibrida: prova online e validacao presencial.
- [ ] Trabalhos/atividades com entrega.
- [ ] Avaliacao pratica presencial.
- [x] Regras de aprovacao por nota, presenca e progresso.
- [x] Geracao automatica de certificado PDF.
- [x] Validacao publica de certificado por codigo.
- [ ] Assinatura digital como integracao posterior.

### Fase 6 — Comunicacao com W-Omni

- [ ] Criar eventos de dominio: aula marcada, falta registrada, conteudo publicado, certificado emitido.
- [ ] Criar templates de notificacao.
- [ ] Integrar WhatsApp via W-Omni.
- [ ] Adicionar email.
- [ ] Preparar push mobile.
- [ ] Criar chat aluno/instrutor ou integracao inicial com grupos WhatsApp.
- [ ] Criar forum por curso/turma.

### Fase 7 — Financeiro

- [ ] Criar planos de curso.
- [ ] Criar assinatura.
- [ ] Criar pagamento por turma.
- [ ] Integrar PIX.
- [ ] Integrar cartao.
- [ ] Integrar boleto.
- [ ] Preparar gateway Asaas/PagSeguro.

### Fase 8 — Documentos e GED/ECM

- [ ] Criar contratos.
- [ ] Criar termos de participacao.
- [ ] Criar anexos e materiais didaticos versionados.
- [ ] Integrar Alfresco Community Edition.
- [ ] Integrar OnlyOffice.
- [ ] Conectar documentos com curso, turma, aluno e empresa.

### Fase 9 — Relatorios, Analytics e IA

- [ ] Relatorio de conclusao por curso/turma.
- [ ] Relatorio de frequencia presencial.
- [ ] Relatorio de engajamento online.
- [ ] Relatorio de desempenho por turma.
- [ ] Relatorio de ROI corporativo.
- [ ] Eventos para Cassandra quando houver volume.
- [ ] Identificacao de risco de evasao.
- [ ] Recomendacao de trilhas por IA.
- [ ] Tutor virtual com contexto de curso, aula e historico do aluno.

### Fase 10 — Mobile e Diferenciais Avancados

- [ ] App mobile.
- [ ] Acesso offline.
- [ ] Check-in presencial pelo app.
- [ ] Notificacoes push.
- [ ] Avaliacao de performance por visao computacional.
- [ ] Presenca automatica por reconhecimento facial.

---

## Decisoes de Arquitetura

| Decisao | Escolha | Motivo |
|---|---|---|
| Backend | FastAPI | Mesmo padrao do W-Matrix, simples para integrar com IA |
| Frontend | Next.js | Mesmo padrao do BeVox frontend |
| Banco operacional | PostgreSQL | Dados transacionais e relacionais |
| Cache/filas leves | Redis | Cache, filas simples e estados temporarios |
| Eventos/telemetria | Cassandra | Logs e eventos quando volume justificar |
| Auth | JWT | Stateless e compativel com outros servicos |
| Arquitetura atual | Monolito modular | Mais rapido para estabilizar dominio |
| Arquitetura futura | Microservicos | Extrair quando houver volume ou fronteira madura |

## Fronteiras de Servico Futuras

- `user-service`: usuarios, empresas, perfis e permissoes.
- `course-service`: cursos, trilhas, modulos, aulas e pre-requisitos.
- `schedule-service`: turmas, agenda, unidades, salas, instrutores, lista de espera e presenca.
- `payment-service`: planos, cobrancas e gateways.
- `notification-service`: W-Omni, templates e eventos.
- `document-service`: contratos, termos, certificados e GED/ECM.
- `analytics-service`: eventos, engajamento, relatorios e IA.

## Entidades do Banco

Estado atual:

```text
students        id, name, email, password_hash, role, is_active, created_at
courses         id, name, description, agent_id, created_at
lessons         id, course_id, title, content, order, type, created_at
enrollments     id, student_id, course_id, enrolled_at
progress        id, student_id, lesson_id, status, updated_at
sessions        id, student_id, lesson_id, bevox_session_id, transcript, started_at, ended_at
attendance      id, student_id, lesson_id, session_id, recorded_at
quizzes         id, lesson_id, passing_score, max_attempts, created_at
quiz_questions  id, quiz_id, question, options, correct_index, order
quiz_attempts   id, student_id, quiz_id, score, passed, answers, attempted_at
```

Proxima expansao critica:

```text
users
organizations
student_profiles
instructor_profiles
learning_paths
learning_path_courses
course_modules
course_prerequisites
completion_rules
locations
rooms
room_resources
classes
class_enrollments
waitlist_entries
scheduled_meetings
attendance_records
checkin_tokens
certificates
notification_events
```

## Pontos Criticos

- Curso nao e turma: curso e o produto academico; turma e uma oferta em periodo, local, instrutor e vagas.
- Aula online nao substitui encontro presencial: ambos precisam de entidades e regras proprias.
- Matricula em curso e inscricao em turma podem ser processos diferentes.
- Certificado depende de regras verificaveis: progresso, provas, presenca e aprovacao pratica.
- Comunicacao precisa nascer por eventos para nao ficar acoplada a telas ou rotas especificas.
