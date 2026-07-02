--
-- PostgreSQL database dump
--

\restrict QW9hNSaobi50pqz7AQ1edPa7yAUaSfSjIOtnvbfdOZhUo3z39AsXrm1mkfdrlRI

-- Dumped from database version 17.10 (9f6157c)
-- Dumped by pg_dump version 17.10 (Ubuntu 17.10-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Ticket" (id, "ticketNumber", "ticketType", note, status, signature, "usedAt", "scannedBy", "createdAt", "updatedAt", "holderName") FROM stdin;
7933eea1-d0d0-4041-b07d-9999a8ea0901	GALA-0001	INDIVIDUEL	\N	VALID	7bb3bc7392cd6e5147bb86dc13509eb8f75740902f301bc16a0a7cd39fd49d18	\N	\N	2026-06-22 20:32:57.134	2026-06-22 20:32:57.134	BAMBARA Delphine
117c2444-e984-458b-8464-b27fd3ce7bf5	GALA-0002	INDIVIDUEL	\N	VALID	1ccf3ef9e8fa91d0eee5616aa71c285b0a24f678bca0f858e643d2b3c30cda85	2026-06-22 20:38:38.024	scanner	2026-06-22 20:33:49.016	2026-06-22 20:39:18.634	ATTEGBRÉ Éric
067c66b9-e6ea-4d9c-a397-4772d76ddfa9	GALA-0003	INDIVIDUEL	\N	VALID	5cb7c42009bdc04a827fee253f0fa826921400e085c7c36553669023e22e57b9	\N	\N	2026-06-22 21:17:47.862	2026-06-22 21:17:47.862	KONATE Zainab
e394c5cb-6b35-4e62-9c1f-eead61d280dc	GALA-0004	INDIVIDUEL	\N	VALID	9459da3e8bca83cfe0243d6c729adaebdc5a9030303485ba0e4396ab1d07e15c	\N	\N	2026-06-22 21:21:34.332	2026-06-22 21:21:34.332	KANTÉ Aboudramane
4fa378e4-04af-45de-8bfd-54701f6f5b89	GALA-0005	INDIVIDUEL	\N	VALID	e0b824f8a124e497668e1c56710b0d76c4972eb3458edb4186db1ac2163d56ce	\N	\N	2026-06-22 22:04:36.053	2026-06-22 22:04:36.053	DJE Jean Claude
9af7fdb3-fcd0-448c-ba1e-d8d34b994f2f	GALA-0006	INDIVIDUEL	\N	VALID	7db868061a19a1d19bc71561fc2f562be51d94b73ccc9c8a3cd113da4a044527	\N	\N	2026-06-22 22:12:33.799	2026-06-22 22:12:33.799	OUATTARA Germaine
23c26f06-1b38-4036-8123-970a1fefa395	GALA-0007	INDIVIDUEL	\N	VALID	7139334f26d5fb7dc965bc8e0fcb8abc1ce7a6b65424811ea5d19b2ff9d6dedc	\N	\N	2026-06-30 00:50:33.395	2026-06-30 00:50:33.395	Ganon Justin
2308b66f-e097-4bb5-9163-1a9de0da382f	GALA-0008	INDIVIDUEL	\N	VALID	a9d0d7969b4a9ff916cf042e591474e6a0690a26bcd5fd13ef1c0263e86e1d9b	\N	\N	2026-06-30 00:57:46.006	2026-06-30 00:57:46.006	Amany Mikaël
1fee3a5c-f9f9-4be5-81eb-13897ee257a4	GALA-0010	GBONHI	Diabagate mory seydou aziz \nTraore fatoumata nônô \nZabsonre Geoffroy Christ Roi \nAkigbe maëva grace mingnon \nOuttara ali habib \nKonate sarrah Raïssa noralyne	VALID	49b9e73128ba02dfe1caaf4b3048540fa2a37fbdf3b6188225f4db055846ed39	\N	\N	2026-07-01 10:54:24.895	2026-07-01 10:54:24.895	JET 7
5cb785ea-8f46-4352-9df9-3a2063da6ab0	GALA-0011	GBONHI	Diabagate mory seydou aziz \nTraore fatoumata nônô \nZabsonre Geoffroy Christ Roi \nAkigbe maëva grace mingnon \nOuttara ali habib \nKonate sarrah Raïssa noralyne	VALID	2ef7f7d50ce5759c54c764a6c686206bf14903a4d5c68939bd050abc9cd6a622	\N	\N	2026-07-01 10:54:24.922	2026-07-01 10:54:24.922	JET 7
0d3be576-09ae-4296-bb21-5ec8afe8bedc	GALA-0012	GBONHI	Diabagate mory seydou aziz \nTraore fatoumata nônô \nZabsonre Geoffroy Christ Roi \nAkigbe maëva grace mingnon \nOuttara ali habib \nKonate sarrah Raïssa noralyne	VALID	26b975c5c21bad2f5b9c519cca0058508378bdbb10c60b15bc0aba8d50963b9f	\N	\N	2026-07-01 10:54:24.947	2026-07-01 10:54:24.947	JET 7
a1824352-5a96-4078-a259-7d4580a98424	GALA-0013	GBONHI	Diabagate mory seydou aziz \nTraore fatoumata nônô \nZabsonre Geoffroy Christ Roi \nAkigbe maëva grace mingnon \nOuttara ali habib \nKonate sarrah Raïssa noralyne	VALID	4fc3f8454a8006b266d73648fe86f9cab1f9e2e67c45d10c2cf88d4357df571d	\N	\N	2026-07-01 10:54:24.974	2026-07-01 10:54:24.974	JET 7
3657f0dd-9ef7-4db6-81ea-c77b917e89f4	GALA-0014	GBONHI	Diabagate mory seydou aziz \nTraore fatoumata nônô \nZabsonre Geoffroy Christ Roi \nAkigbe maëva grace mingnon \nOuttara ali habib \nKonate sarrah Raïssa noralyne	VALID	826a2910b88fca5e6b7d5ca7ea05f65cbc430ab5a10a4a50c7d3134f072d5a7d	\N	\N	2026-07-01 10:54:25	2026-07-01 10:54:25	JET 7
1bb15809-b844-40d5-af32-63c2aecefeab	GALA-0009	GBONHI	Diabagate mory seydou aziz \nTraore fatoumata nônô \nZabsonre Geoffroy Christ Roi \nAkigbe maëva grace mingnon \nOuttara ali habib \nKonate sarrah Raïssa noralyne	VALID	c5293f72722c8ce67ccda0e226ba22a5b9bfca2a497b3c94028b0f09b097ce1b	\N	\N	2026-07-01 10:54:24.847	2026-07-01 10:55:38.91	JET 7
\.


--
-- PostgreSQL database dump complete
--

\unrestrict QW9hNSaobi50pqz7AQ1edPa7yAUaSfSjIOtnvbfdOZhUo3z39AsXrm1mkfdrlRI

