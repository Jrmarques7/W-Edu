# W-Edu - Matriz de Permissoes

Este documento registra a regra operacional por papel. A nomenclatura `User` e `/users` e a direcao nova da API; `Student` e `/students` permanecem como compatibilidade enquanto existirem tabelas e FKs legadas.

## Papeis

- `student`: aluno.
- `instructor`: instrutor.
- `coordinator`: coordenacao academica.
- `company_manager`: gestor de empresa B2B.
- `admin`: administrador global.

## Regras Gerais

- Autenticacao e area do aluno exigem usuario autenticado ativo.
- Financeiro, documentos e analytics corporativo continuam restritos a `admin` e `company_manager`, com escopo de empresa aplicado nos services.
- Coordenador pode operar a rotina academica, mas nao acessa financeiro/analytics/documentos corporativos pelo menu.
- Acoes destrutivas sensiveis ficam restritas a `admin`.

## Usuarios e Organizacoes

| Recurso | Student | Instructor | Coordinator | Company Manager | Admin |
| --- | --- | --- | --- | --- | --- |
| Ver/editar propria conta | Sim | Sim | Sim | Sim | Sim |
| Listar usuarios admin | Nao | Nao | Sim | Empresa propria | Sim |
| Criar usuario | Nao | Nao | Aluno/instrutor | Aluno/instrutor da empresa | Sim |
| Editar usuario | Nao | Nao | Aluno/instrutor | Aluno/instrutor da empresa | Sim |
| Excluir usuario | Nao | Nao | Nao | Nao | Sim |
| Gerir empresa | Nao | Nao | Listar | Empresa propria | Sim |

## Academico

| Recurso | Student | Instructor | Coordinator | Company Manager | Admin |
| --- | --- | --- | --- | --- | --- |
| Listar/ver cursos, aulas, modulos e trilhas | Sim | Sim | Sim | Sim | Sim |
| Criar/editar curso | Nao | Nao | Sim | Nao | Sim |
| Excluir curso | Nao | Nao | Nao | Nao | Sim |
| Criar/editar modulo | Nao | Nao | Sim | Nao | Sim |
| Excluir modulo | Nao | Nao | Nao | Nao | Sim |
| Criar/editar pre-requisito | Nao | Nao | Sim | Nao | Sim |
| Excluir pre-requisito | Nao | Nao | Nao | Nao | Sim |
| Criar/editar trilha | Nao | Nao | Sim | Nao | Sim |
| Excluir trilha | Nao | Nao | Nao | Nao | Sim |
| Vincular curso a trilha | Nao | Nao | Sim | Nao | Sim |
| Remover curso da trilha | Nao | Nao | Nao | Nao | Sim |
| Criar/editar aula | Nao | Nao | Sim | Nao | Sim |
| Excluir aula | Nao | Nao | Nao | Nao | Sim |
| Criar/editar quiz e questoes | Nao | Nao | Sim | Nao | Sim |
| Excluir quiz e questoes | Nao | Nao | Nao | Nao | Sim |

## Agenda e Presencial

| Recurso | Student | Instructor | Coordinator | Company Manager | Admin |
| --- | --- | --- | --- | --- | --- |
| Listar locais, salas, turmas e encontros | Sim | Sim | Sim | Sim | Sim |
| Criar/editar locais, salas e turmas | Nao | Nao | Sim | Nao | Sim |
| Entrar em turma | Sim | Sim | Sim | Sim | Sim |
| Listar inscricoes e espera da turma | Nao | Nao | Sim | Nao | Sim |
| Criar/editar/encerrar encontro | Nao | Nao | Sim | Nao | Sim |
| Gerar/listar token de check-in | Nao | Nao | Sim | Nao | Sim |
| Check-in do proprio usuario | Sim | Sim | Sim | Sim | Sim |
| Registro manual/listagem de presenca | Nao | Nao | Sim | Nao | Sim |

## Certificacao

| Recurso | Student | Instructor | Coordinator | Company Manager | Admin |
| --- | --- | --- | --- | --- | --- |
| Ver propria certificacao | Sim | Sim | Sim | Sim | Sim |
| Gerir regra de certificado | Nao | Nao | Sim | Nao | Sim |
| Ver elegibilidade/listagens | Nao | Nao | Sim | Nao | Sim |
| Emitir certificado | Nao | Nao | Sim | Nao | Sim |
| Revogar certificado | Nao | Nao | Nao | Nao | Sim |
| Validar certificado publico | Publico | Publico | Publico | Publico | Publico |

## Comunicacao

| Recurso | Student | Instructor | Coordinator | Company Manager | Admin |
| --- | --- | --- | --- | --- | --- |
| Forum e chat autenticado | Sim | Sim | Sim | Sim | Sim |
| Templates e eventos de notificacao | Nao | Nao | Sim | Nao | Sim |
| Processar eventos pendentes | Nao | Nao | Sim | Nao | Sim |

## Administrativo Corporativo

| Recurso | Student | Instructor | Coordinator | Company Manager | Admin |
| --- | --- | --- | --- | --- | --- |
| Financeiro | Nao | Nao | Nao | Empresa propria | Sim |
| Documentos/GED | Nao | Nao | Nao | Empresa propria | Sim |
| Analytics operacional/corporativo | Proprio | Nao | Nao | Empresa propria | Sim |
