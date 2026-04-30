# W-Edu — Controle de Implementacao

Ultima atualizacao: 2026-04-30

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
- Encerramento de encontro gera faltas automaticamente para inscritos ativos sem registro.
- Resumo de frequencia por encontro.

### Usuarios, perfis e empresas

- Papeis expandidos: aluno, instrutor, coordenador, gestor empresa e admin.
- Empresas B2B.
- Vinculo de usuario com empresa.
- Perfil detalhado de aluno.
- Perfil de instrutor.
- Admin de usuarios com selecao de papel e empresa.

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

## Migrations Criadas

- `9d8f1c2a3b4e_expand_academic_domain.py`
- `a1b2c3d4e5f6_add_schedule_domain.py`
- `b2c3d4e5f6a7_add_presential_attendance.py`

## Validacoes Realizadas

- Backend compile com `backend/.venv/bin/python -m compileall app`: OK.
- Import da API FastAPI com `from main import app`: OK.
- Alembic SQL offline com `alembic upgrade head --sql`: OK.
- Frontend build com `npm run build`: OK.

Observacao: `alembic upgrade head` online nao foi aplicado porque o PostgreSQL configurado nao respondeu no ambiente local durante a validacao.

## Falta Implementar

### Usuarios e perfis

- Separar `Student` de `User` ou migrar o modelo atual para usuario com nome semantico correto.
- Telas completas para editar perfis detalhados de aluno e instrutor.
- Permissoes refinadas por coordenador e gestor empresa.

### Instrutores

- Agenda real do professor.
- Regras para evitar conflito de agenda.

### Presencial avancado

- Relatorio completo de presentes, ausentes e atrasados por encontro.
- Registro automatico de faltas apos encerramento do encontro.
- QR Code visual na interface, nao apenas token textual.
- Check-in pelo app/mobile.
- Biometria/facial real.

### Avaliacoes e certificacao

- Regras de aprovacao por progresso, nota e frequencia.
- Certificacao por curso com regra configuravel.
- Emissao automatica de certificado quando o aluno atende aos criterios.
- Validacao publica de certificado por codigo.
- Avaliacao hibrida: prova online e validacao presencial.
- Trabalhos/atividades com entrega.
- Avaliacao pratica presencial.
- Certificado PDF.
- Assinatura digital.

### Comunicacao

- Eventos de dominio persistidos.
- Templates de notificacao.
- Base para integracao W-Omni.
- Lembrete de aula.
- Falta registrada.
- Presenca registrada.
- Certificado emitido.
- WhatsApp, email e push ainda dependem de adaptadores reais.
- Novo conteudo publicado.
- Chat aluno/instrutor.
- Grupos por turma.
- Forum.

### Financeiro

- Planos de curso.
- Assinaturas.
- Pagamento por turma.
- PIX.
- Cartao.
- Boleto.
- Gateway Asaas/PagSeguro como integracao futura.
- Estrutura base de planos, assinaturas e cobrancas.

### Documentos e GED/ECM

- Base GED local com contratos, termos e materiais versionados.
- Integracao Alfresco Community Edition.
- Integracao OnlyOffice.

### Relatorios, analytics e IA

- Taxa de conclusao.
- Frequencia presencial.
- Engajamento online.
- Desempenho por turma.
- ROI corporativo.
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

Implementar usuarios e perfis:

- Criar base de usuarios mais generica.
- Expandir roles.
- Criar perfis de aluno e instrutor.
- Criar empresas B2B.
- Migrar referencias atuais sem quebrar login.

Esse marco destrava instrutores reais, empresas, agenda de professor, relatorios corporativos e permissoes mais corretas.
