# W-Edu — Backlog de Implementacao

## Sequencia Recomendada

### Marco 1 — Dominio Academico Correto

Objetivo: deixar a base pronta para curso, trilha, turma e presencial.

- Criar modelo `User` ou planejar migracao segura do `Student` atual.
- Expandir papeis para aluno, instrutor, coordenador, gestor empresa e admin.
- Criar `Organization` para B2B.
- Criar `CourseModule`.
- Adicionar modalidade em `Course`: online, presencial, hibrido.
- Expandir `LessonType`: texto, video, PDF, live, presencial, voz e avaliacao.
- Criar `LearningPath` e relacao com cursos.
- Criar pre-requisitos entre cursos.
- Criar regras de conclusao.

Aceite:

- Admin consegue criar curso hibrido com modulos e aulas de tipos diferentes.
- Curso pode ser ligado a uma trilha.
- Curso pode exigir outro curso como pre-requisito.
- API preserva compatibilidade minima com telas atuais.

### Marco 2 — Turmas e Agenda

Objetivo: separar curso de oferta/turma.

- [x] Criar `Location`.
- [x] Criar `Room`.
- [x] Criar recursos em `Room`.
- [x] Criar `ClassOffering`.
- [x] Criar `ClassEnrollment`.
- [x] Criar `WaitlistEntry`.
- [x] Criar `ScheduledMeeting`.
- Criar disponibilidade de instrutor.

Aceite:

- Admin cria turma de um curso com periodo, vagas, instrutor e sala.
- Aluno entra em turma se houver vaga.
- Aluno entra em lista de espera quando a turma esta cheia.
- Instrutor visualiza agenda.

### Marco 3 — Presenca Presencial

Objetivo: controlar presenca real em aulas presenciais e hibridas.

- [x] Criar `AttendanceRecord` por encontro agendado.
- [x] Criar token de check-in por QR Code.
- [x] Registrar entrada do aluno com janela de validade.
- Registrar falta automaticamente apos encerramento do encontro.
- [x] Preparar campos para origem da presenca: manual, QR Code, webhook, biometria, facial.

Aceite:

- Coordenador gera QR Code para um encontro.
- Aluno faz check-in.
- Presenca fica vinculada a turma, encontro, aluno e metodo de validacao.
- Relatorio mostra presentes, ausentes e atrasados.

### Marco 4 — Avaliacao e Certificacao

Objetivo: concluir o ciclo academico.

- Regras de aprovacao por progresso, nota e frequencia.
- Dashboard de progresso por curso.
- Avaliacao hibrida: quiz online e validacao presencial.
- Entregas de trabalho.
- Certificado PDF.
- Validacao publica por codigo.
- Validacao publica por QR Code.

Aceite:

- Aluno aprovado recebe certificado automaticamente.
- Certificado possui URL publica de validacao.
- Admin consegue auditar os criterios usados na emissao.

### Marco 5 — Comunicacao W-Omni

Objetivo: comunicar eventos academicos sem acoplar rotas a canais.

- [x] Criar tabela/fila de `NotificationEvent`.
- [x] Criar templates.
- [x] Publicar eventos de aula marcada, falta, presenca, conteudo publicado e certificado.
- [x] Publicar lembretes de aula agendados.
- [x] Processar eventos pendentes automaticamente.
- [x] Integrar envio via W-Omni para WhatsApp.
- [x] Adicionar email como canal secundario.
- [x] Criar forum por curso.
- [x] Criar chat aluno/instrutor.

Aceite:

- Criacao de turma/aula gera eventos auditaveis.
- Historico de notificacao fica auditavel.
- Canais reais entram depois como adaptadores.

### Marco 6 — Financeiro

Objetivo: monetizar cursos, turmas e assinaturas.

- [x] Planos de curso.
- [x] Assinaturas por aluno ou empresa.
- [x] Cobranças por turma, curso ou assinatura.
- [x] Estrutura base para PIX, cartao e boleto.
- [ ] Integrar gateway real (Asaas/PagSeguro).

Aceite:

- Admin cria plano e assinatura.
- Admin registra cobranca e marca como paga/falha.
- Empresa pode concentrar cobrancas e assinaturas.

### Marco 7 — Documentos e GED/ECM

Objetivo: tratar documentos como parte do dominio, nao como anexo solto.

- [x] Criar base GED local com upload e versionamento.
- [x] Conectar documentos com curso, turma, aluno e empresa.
- [ ] Criar contratos.
- [ ] Criar termos de participacao.
- [ ] Criar anexos e materiais didaticos versionados.
- [ ] Integrar Alfresco Community Edition.
- [ ] Integrar OnlyOffice.

Aceite:

- Admin cadastra um documento e relaciona com o dominio.
- Documento pode ter versoes e download.
- Estrutura fica pronta para integracao com GED externo.

### Marco 8 — Relatorios, Analytics e IA

Objetivo: dar visibilidade operacional e preparacao para IA sem misturar com a operacao.

- [x] Criar base de analytics operacional com overview, curso, turma e aluno.
- [x] Relatorio de conclusao por curso/turma.
- [x] Relatorio de frequencia presencial.
- [x] Relatorio de engajamento online.
- [x] Relatorio de desempenho por turma.
- [x] Relatorio de ROI corporativo.
- [ ] Eventos para Cassandra quando houver volume.
- [ ] Identificacao de risco de evasao.
- [ ] Recomendacao de trilhas por IA.
- [ ] Tutor virtual com contexto academico completo.

Aceite:

- Admin visualiza KPI geral e detalhamento por curso/turma/aluno.
- Gestor consegue enxergar seus proprios indicadores.
- Estrutura de dados fica pronta para IA e eventos de volume.

## Primeiro Pacote de Codigo

O primeiro pacote deve ser pequeno e migravel:

- [x] Adicionar enums de modalidade de curso e tipos de aula.
- [x] Criar tabelas de modulos de curso, trilhas e pre-requisitos.
- [x] Atualizar schemas, repositories e services necessarios.
- [x] Atualizar admin de cursos/aulas para capturar modalidade, modulo e tipo.
- [x] Criar migration Alembic.
- [x] Rodar validacoes de import/compile e build frontend.

## Riscos

- Renomear `Student` para `User` cedo demais pode quebrar toda a autenticacao; fazer migracao planejada.
- Criar microservicos antes de estabilizar entidades vai aumentar retrabalho.
- Implementar check-in facial antes do QR Code atrasa a entrega presencial basica.
- Certificado sem regras auditaveis perde validade operacional.
