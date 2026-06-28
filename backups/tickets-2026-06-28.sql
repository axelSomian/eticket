--
-- PostgreSQL database dump
--

\restrict HkpXulbQNwCIsqhJqCCGmB8cnvvuNXHTKSCLcdgK2l4HbFKc26I6teGgMlCjdNs

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
\.


--
-- PostgreSQL database dump complete
--

\unrestrict HkpXulbQNwCIsqhJqCCGmB8cnvvuNXHTKSCLcdgK2l4HbFKc26I6teGgMlCjdNs

