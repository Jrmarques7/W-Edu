# W-Edu — Visao Alvo da Plataforma

Este documento consolida o ponto de chegada do W-Edu como plataforma hibrida de educacao, cobrindo EAD, presencial, turmas, comunicacao, certificacao, documentos, financeiro, analytics e integracoes.

## Principios do Produto

- Separar claramente curso, trilha, turma, aula, encontro presencial, matricula, progresso e certificado.
- Tratar o presencial como recurso de primeira classe, nao como observacao em uma aula online.
- Permitir composicao hibrida: teoria online, pratica presencial, live, PDF, video, prova online e validacao presencial.
- Centralizar eventos de comunicacao para WhatsApp, email e push.
- Manter a primeira versao em monolito modular, preparando fronteiras para microservicos quando o dominio estabilizar.

## Modulos Alvo

### 1. Nucleo Academico

- Cursos online, presenciais e hibridos.
- Trilhas de aprendizagem com niveis e ordem sugerida.
- Modulos e aulas com tipos: texto, video, PDF, live, presencial, voz e avaliacao.
- Pre-requisitos entre cursos.
- Certificacao automatica por regras de conclusao.
- Matriculas em curso e em turma.

### 2. Usuarios e Organizacoes

- Alunos.
- Instrutores.
- Coordenadores e administradores.
- Empresas B2B.
- Perfils detalhados com historico, evolucao, presencas e certificados.

### 3. Turmas, Agenda e Presencial

- Turmas por curso, periodo, unidade, sala, instrutor e capacidade.
- Vagas limitadas.
- Lista de espera.
- Encontros presenciais com check-in.
- Presenca via QR Code como primeira entrega; biometria/facial como evolucao.
- Locais, unidades, salas e recursos como projetor, equipamentos e capacidade.

### 4. Instrutores

- Agenda do professor.
- Especialidades.
- Disponibilidade.
- Avaliacao por alunos.
- Vinculo com turmas, aulas praticas, lives e avaliacoes.

### 5. EAD

- Video aulas.
- PDFs e materiais.
- Lives.
- Quizzes e provas.
- Trabalhos.
- Avaliacao pratica presencial.
- Progresso por aula, modulo, curso e trilha.
- Tempo assistido, engajamento e ranking opcional.
- SCORM fica como modulo enterprise posterior.

### 6. Comunicacao

- Eventos de notificacao integrados ao W-Omni.
- WhatsApp como canal principal.
- Email e push.
- Lembretes de aula, faltas, novo conteudo, certificado disponivel e cobranca.
- Chat aluno/instrutor.
- Grupos por turma via WhatsApp ou chat interno.
- Forum por curso ou turma.

### 7. Financeiro

- Planos de curso.
- Assinaturas.
- Pagamento por turma.
- PIX, cartao e boleto.
- Integracao futura com Asaas ou PagSeguro.

### 8. Documentos e Certificacao

- Contratos.
- Termos de participacao.
- Materiais didaticos.
- Certificados em PDF.
- Assinatura digital.
- Validacao publica por QR Code.
- Integracao futura com Alfresco Community Edition e OnlyOffice.

### 9. Relatorios e Inteligencia

- Taxa de conclusao.
- Frequencia presencial.
- Engajamento online.
- Desempenho por turma.
- ROI corporativo.
- Identificacao de evasao.
- Recomendacao de trilhas por IA.

### 10. Diferenciais

- Tutor virtual por curso ou aula.
- Recomendacoes de conteudo.
- Correcao automatica de atividades.
- Avaliacao de performance por visao computacional.
- Presenca automatica por reconhecimento facial.
- App mobile com offline, notificacoes e check-in presencial.

## Fronteiras de Servico Futuras

A evolucao recomendada e monolito modular primeiro, microservicos depois:

- `user-service`: usuarios, empresas, perfis e permissoes.
- `course-service`: cursos, trilhas, modulos, aulas e pre-requisitos.
- `schedule-service`: turmas, agenda, unidades, salas, instrutores, lista de espera e presenca.
- `payment-service`: planos, cobrancas e gateways.
- `notification-service`: W-Omni, templates e eventos.
- `document-service`: contratos, termos, certificados e GED/ECM.
- `analytics-service`: eventos, engajamento, relatorios e IA.

## Banco de Dados

- PostgreSQL para dados transacionais.
- Cassandra para eventos, logs, telemetria e trilhas de auditoria quando houver volume que justifique.
- Redis para cache, filas leves e controle de sessoes temporarias.

## Pontos Criticos

- Curso nao e turma: curso e o produto academico; turma e uma oferta em periodo, local, instrutor e vagas.
- Aula online nao substitui encontro presencial: ambos precisam de entidades e regras proprias.
- Matricula em curso e inscricao em turma podem ser processos diferentes.
- Certificado depende de regras verificaveis: progresso, provas, presenca e aprovacao pratica.
- Comunicacao precisa nascer por eventos para nao ficar acoplada a telas ou rotas especificas.
