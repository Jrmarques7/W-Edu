# W-Edu — Controle de Implementacao

Ultima atualizacao: 2026-05-08

## Resumo Executivo

O projeto ja possui uma base LMS/EAD com autenticacao, cursos, aulas, matriculas, progresso, sessoes de voz e quiz. Nesta rodada, a plataforma foi expandida para suportar dominio academico hibrido: cursos online/presenciais/hibridos, modulos, trilhas, pre-requisitos, turmas, unidades, salas, encontros presenciais/lives e presenca por check-in.

## Concluido

### Base existente

- Autenticacao JWT.
- Alunos e administrador.
- Cursos.
- Aulas.
- Matriculas em curso.
- Progresso por aula.
- Sessoes de voz.
- Presenca basica vinculada a sessao/aula.
- Quiz por aula.
- Admin basico de cursos, aulas e alunos.
- Frontend com dashboard, catalogo, curso, aula, progresso, sessoes e configuracoes.

### Dominio academico

- Curso com modalidade: `online`, `in_person`, `hybrid`.
- Aulas com tipos: `text`, `video`, `pdf`, `live`, `in_person`, `voice`, `assessment`.
- Modulos de curso.
- Trilhas de aprendizagem.
- Cursos vinculados a trilhas.
- Pre-requisitos entre cursos.
- Rotas de API para modulos, trilhas e pre-requisitos.
- Admin de cursos atualizado para modalidade, modulos e tipos de aula.

### Turmas, agenda e presencial

- Unidades/locais.
- Salas com capacidade.
- Recursos de sala/equipamento em campo de texto.
- Turmas/ofertas por curso, periodo, sala, instrutor opcional, capacidade e status.
- Inscricao em turma separada da matricula em curso.
- Lista de espera quando turma esta cheia.
- Encontros agendados presenciais, live ou hibridos.
- Tela admin `/admin/schedule`.
- Menu admin com entrada Agenda.

### Presenca presencial

- Registro de presenca por encontro agendado.
- Token de check-in com validade.
- Check-in por token/QR.
- Status de presenca: `present`, `late`, `absent`.
- Metodos preparados: `manual`, `qr_code`, `webhook`, `biometric`, `facial`.
- Admin gera token de check-in e consulta quantidade de presencas.
- Admin visualiza QR Code de check-in com link copiavel.
- Aluno pode abrir `/check-in/{token}` para registrar presenca autenticada.
- Admin consulta relatorio detalhado por encontro com aluno, status, horario e metodo de registro.
- Admin ajusta manualmente presenca, atraso ou falta por aluno no relatorio do encontro.
- Criacao/edicao de encontros bloqueia conflitos de sala e instrutor no mesmo horario.
- Encerramento de encontro gera faltas automaticamente para inscritos ativos sem registro.
- Resumo de frequencia por encontro.

### Usuarios, perfis e empresas

- Tabela fisica principal de identidade migrada de `students` para `users` via migration `c6d7e8f9a0b1`.
- Camada semantica `User` criada com endpoints publicos `/users`; aliases `Student` e rotas `/students` seguem como compatibilidade de API e dominio academico.
- Endpoints admin tambem aceitam `/admin/users`, mantendo `/admin/students` por compatibilidade.
- Frontend admin passou a consumir `/admin/users` e ganhou rota `/admin/users`, preservando `/admin/students` como rota legada.
- Tela de configuracoes permite editar perfil proprio com nome, telefone, documento, cargo, departamento e bio.
- Perfil admin permite editar dados de aluno/usuario, perfil de instrutor, disponibilidade e avaliacoes.
- Frontend passou a bloquear acesso direto a paginas `/admin/*` fora do escopo do papel, alem de filtrar o menu lateral.
- Papeis expandidos: aluno, instrutor, coordenador, gestor empresa e admin.
- Empresas B2B.
- Vinculo de usuario com empresa.
- Perfil detalhado de aluno.
- Perfil de instrutor.
- Admin de usuarios com selecao de papel e empresa.
- Coordenador passou a ter acesso a gestao academica de usuarios, cursos, aulas, agenda, certificados e comunicacao sem abrir rotas financeiras.
- Acoes destrutivas sensiveis ficaram restritas a admin: exclusao de usuarios, cursos, modulos, pre-requisitos, aulas e quizzes; revogacao de certificado tambem permanece admin-only.
- Tela admin de cursos permite criar, editar e excluir modulos conforme permissao do papel.
- Tela admin de cursos permite listar, adicionar e remover pre-requisitos conforme permissao do papel.
- Tela admin de trilhas permite criar/editar trilhas e vincular cursos; exclusao de trilhas e remocao de cursos da trilha permanecem admin-only.
- Catalogo de cursos exibe trilhas de aprendizagem e permite matricula/continuidade pelos cursos vinculados.
- Aluno ganhou tela `Meus certificados` para consultar certificados emitidos e codigos de validacao.
- Validacao publica de certificado disponivel em `/validate-certificate`.
- Certificacao por curso com regra configuravel de progresso, quiz e frequencia.
- Emissao manual e automatica de certificado quando o aluno atende aos criterios.
- Certificado PDF gerado no backend e baixavel pelo aluno, admin ou coordenador autorizado.
- Certificados emitidos exibem QR Code para validacao publica por codigo.
- Certificados recebem assinatura digital interna HMAC-SHA256 e a validacao publica verifica a integridade da assinatura.
- Aulas do tipo avaliacao aceitam entrega de atividade com texto e/ou arquivo, reenvio e correcao por admin/coordenador na tela admin de aulas.
- Elegibilidade de certificado considera quizzes online e entregas avaliativas corrigidas com nota minima.
- Encontros presenciais/hibridos aceitam avaliacao pratica por aluno com nota e feedback no relatorio de presenca.
- Elegibilidade de certificado considera avaliacoes praticas presenciais vinculadas a aulas avaliativas.
- Matriz de permissoes criada em `docs/PERMISSIONS.md`.
- Verificador leve de rotas criticas criado em `backend/scripts/check_permissions.py`.
- Verificador dos guards de papel criado em `backend/scripts/check_role_guards.py`.

### Instrutores

- Especialidades no perfil de instrutor.
- Disponibilidade semanal cadastravel.
- Avaliacoes simples de alunos/admin.
- Resumo minimo na tela de usuarios.

### Planejamento e documentacao

- Roadmap reestruturado.
- Visao alvo da plataforma.
- Backlog de implementacao.
- Controle de status do projeto.

### Documentos e GED/ECM

- Base de documentos com upload local, versionamento e download.
- Vinculo de documentos com curso, turma, empresa e aluno.
- Admin de documentos em `/admin/documents`.

### Comunicacao

- Tabela de eventos de notificacao.
- Templates de notificacao internos.
- Eventos automaticos para turma criada, encontro agendado, falta registrada, presenca registrada, conteudo publicado e certificado emitido.
- Lembretes de encontro agendados automaticamente 24h antes do inicio.
- Tela admin permite criar eventos futuros e processar eventos pendentes prontos.
- Worker interno processa eventos pendentes automaticamente em intervalo configuravel.
- Adaptador inicial W-Omni/WhatsApp via `POST {WOMNI_URL}/messages`.
- Adaptador de email via SMTP.
- Fórum por curso com tópicos e respostas.
- Chat persistido por curso entre aluno e instrutor/coordenação.

### Financeiro

- Planos de curso.
- Assinaturas por aluno ou empresa.
- Cobrancas por turma, curso ou assinatura.
- Estrutura base para PIX, cartao e boleto.
- Integracao Asaas para criacao de cobranca via `POST /v3/payments`.
- Cobranças Asaas armazenam referencia externa, status do gateway, checkout, boleto e payload/QR Pix quando disponivel.

## Migrations Criadas

- `9d8f1c2a3b4e_expand_academic_domain.py`
- `a1b2c3d4e5f6_add_schedule_domain.py`
- `b2c3d4e5f6a7_add_presential_attendance.py`
- `c2d3e4f5a6b7_add_assignment_submissions.py`
- `c3d4e5f6a7b8_add_practical_assessments.py`
- `c4d5e6f7a8b9_add_certificate_signatures.py`
- `c5d6e7f8a9b0_add_charge_gateway_checkout_fields.py`
- `c6d7e8f9a0b1_rename_students_table_to_users.py`

## Validacoes Realizadas

- Backend compile com `backend/.venv/bin/python -m compileall app`: OK.
- Import da API FastAPI com `from main import app`: OK.
- Alembic SQL offline com `alembic upgrade head --sql`: OK.
- Frontend build com `npm run build`: OK.
- Verificacao de permissoes com `backend/.venv/bin/python scripts/check_permissions.py`: OK.
- Verificacao de guards com `backend/.venv/bin/python scripts/check_role_guards.py`: OK.
- Verificacao HTTP de permissoes criticas com SQLite temporario em `backend/.venv/bin/python scripts/check_api_permissions.py`: OK.

Observacao: `alembic upgrade head` online nao foi aplicado porque o PostgreSQL configurado nao respondeu no ambiente local durante a validacao.

## Falta Implementar

### Usuarios e perfis

- Expandir a verificacao HTTP de permissoes para cobrir todos os recursos administrativos restantes e escopos por organizacao.
- Renomear gradualmente simbolos internos `Student*` para `User*` onde fizer sentido, preservando campos academicos `student_id`.

### Instrutores

- Agenda real do professor.
- Expandir disponibilidade semanal para sugestao automatica de horarios.

### Presencial avancado

- Check-in pelo app/mobile.
- Biometria/facial real.

### Comunicacao

- Base para integracao W-Omni.
- Push ainda depende de adaptador real.
- Grupos por turma.

### Documentos e GED/ECM

- Base GED local com contratos, termos e materiais versionados.
- Integracao Alfresco Community Edition.
- Integracao OnlyOffice.

### Relatorios, analytics e IA

- Base de analytics operacional com overview, curso, turma e aluno.
- Painel admin em `/admin/analytics`.
- Relatorio de conclusao por curso/turma.
- Relatorio de frequencia presencial.
- Relatorio de engajamento online.
- Relatorio de desempenho por turma.
- Relatorio de ROI corporativo.
- Eventos para Cassandra.
- Identificacao de risco de evasao.
- Recomendacao de trilhas por IA.
- Tutor virtual com contexto academico completo.
- Correcao automatica de atividades.

### Mobile

- App mobile.
- Acesso offline.
- Notificacoes push.
- Check-in presencial.

### Arquitetura futura

- Modularizacao interna mais forte por dominio.
- Extracao futura para microservicos:
  - `user-service`
  - `course-service`
  - `schedule-service`
  - `payment-service`
  - `notification-service`
  - `document-service`
  - `analytics-service`

## Proximo Marco Recomendado

Implementar agenda real do professor:

- Usar disponibilidade ativa do instrutor para sugerir horarios.
- Cruzar disponibilidade com encontros ja agendados.
- Exibir agenda consolidada por instrutor.

Esse marco destrava alocacao mais confiavel de instrutores, conflitos mais claros e planejamento de turmas.
