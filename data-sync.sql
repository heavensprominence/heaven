--
-- PostgreSQL database dump
--

\restrict MYQThVgXjWRM6Wl7hUfcoLz8ckImvECt0CqYyjegXVrdO1ugSFhzV0rEJEcgwCp

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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
-- Data for Name: category_translations; Type: TABLE DATA; Schema: public; Owner: heavenslive
--

COPY public.category_translations (id, category, language_code, name, translated_by, created_at, updated_at) FROM stdin;
baef918b-2be8-4a43-a9fc-91493efd8569	electronics	fa	الکترونیک	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
20f0c82a-094c-4579-8d50-931e8cb42c29	clothing	fa	لباس	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
6b9332e1-3778-48d4-b4b7-054604790a1e	vehicles	fa	وسایل نقلیه	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
a7d43a87-630d-4b1b-a818-4dfa68aa594f	collectibles	fa	کلکسیونی ها	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
059ef17d-dc4f-4fb4-881c-9a3b1877d863	electronics	ar	إلكترونيات	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
973a45a4-933c-40ca-a19d-5fd48184ae32	clothing	ar	ملابس	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
dc29cce2-081e-4938-9e74-c1cd2748058c	vehicles	ar	المركبات	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
b5aadaf4-a047-4c02-a2a8-df6866250772	collectibles	ar	المقتنيات	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
3062930a-ee55-4489-8fb7-8c828b4d7684	electronics	de	Elektronik	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
94713de5-a834-4350-9c56-5abc05164d07	clothing	de	Kleidung	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
3df112db-a7e6-4115-81a2-34a823db0317	vehicles	de	Fahrzeuge	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
9a7f1789-db3a-4c5a-b299-0a6a584e0e17	collectibles	de	Sammlerstücke	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
2ae20b9d-c4b6-4ac9-bb3f-1657180c9de3	electronics	es	Electrónica	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
3da13a41-6a99-4ef2-8502-462bf79395a4	clothing	es	Ropa	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
31206cc7-b0b5-48b8-9ace-60f445ad548a	vehicles	es	Vehículos	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
d56c3883-c633-4ac2-9c90-989543c0d626	collectibles	es	Coleccionables	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
25eb5b23-37ea-4c40-959b-494c7176e901	electronics	fr	Électronique	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
078a78b7-e712-404d-adba-690d700d01a8	clothing	fr	Vêtements	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
4b3ce396-bc1b-4462-8f11-c77a255966a6	vehicles	fr	Véhicules	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
3d7122b2-da4a-4aeb-b1a9-6b813f305d67	collectibles	fr	Objets de collection	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
beafe3a5-01e8-41be-b025-bfc7f2277610	electronics	ja	エレクトロニクス	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
f250bdd5-79ec-4aaa-a029-ff60207ad2f4	clothing	ja	衣類	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
05bcb446-2b95-4835-846c-22dc425dcd84	vehicles	ja	車両	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
80c671f9-5557-4578-9ab8-6c3f39a8e6de	collectibles	ja	収集品	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
b0f20861-6b3d-495f-aa49-2927e7a3ed09	electronics	zh	电子产品	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
a4329720-4294-4f0a-96f9-7899d2ddd9c5	clothing	zh	衣服	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
afc8d108-d195-4119-8191-ae2ea50bdbe0	vehicles	zh	车辆	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
8d515696-69fb-45a3-b028-c26e40ef297d	collectibles	zh	收藏品	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
11ebad3d-cb7f-44ba-b8cd-5fe36699b537	electronics	ko	전자제품	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
c4eeec52-68a3-4d34-a1f1-5c421c4039fe	clothing	ko	의류	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
716ee670-e01a-41ba-9961-2bc393ed2161	vehicles	ko	차량	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
601e8009-a56b-411a-af7e-a528667134e4	collectibles	ko	수집품	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
6d9147b5-b5b4-4b83-82e1-82eff551f120	electronics	ru	Электроника	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
68635415-fcb7-46cb-ac65-2fc1bb15e4cb	clothing	ru	Одежда	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
b583496b-8ebf-45ac-81a9-7f5c15f18c5d	vehicles	ru	Транспортные средства	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
e72e427e-037b-42fa-aa99-429856f58dd0	collectibles	ru	Коллекционирование	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
78b38e13-87fa-47ef-a108-82ec18deee26	electronics	pt	Eletrônica	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
0285d719-a740-4b88-8bea-a63e56446997	clothing	pt	Roupas	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
ce1af813-7b30-4277-9c4f-1ac8977e8dbd	vehicles	pt	Veículos	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
149507d9-1f91-4314-ad01-64f92ea02a3d	collectibles	pt	Colecionáveis	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
ca63ffc6-9cea-4e45-81db-9a38fa4bb920	electronics	hi	इलेक्ट्रानिक्स	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
c6fbdd7d-c19d-4a4a-9c76-c1f986ac365a	clothing	hi	वस्त्र	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
9a16a52f-5f74-427e-9aaa-b70505dca0cc	vehicles	hi	वाहनों	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
eb2e5f05-a789-47af-a4b7-05884420e998	collectibles	hi	संग्रह	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
c04cdb83-4d08-4236-bf9c-98ded5997c4f	electronics	sv	Elektronik	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
fce8c7b8-9546-428f-bb72-0685f96d6174	clothing	sv	Kläder	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
bdbf5109-ec9b-4f69-8f00-307564d7a2f6	vehicles	sv	Fordon	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
b90af992-7d88-4a01-8276-c433f89adbf7	collectibles	sv	Samlarföremål	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
50c8c683-4f49-441e-8a6a-0e47171d084d	electronics	tl	Electronics	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
90bb3819-a98a-4bad-af24-957a634f89e2	clothing	tl	Damit	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
64dc3a8d-072a-4cf8-913c-55adcf62a11c	vehicles	tl	Mga sasakyan	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
e799b586-ccc2-434d-a75f-82c9f0e836e3	collectibles	tl	Mga collectible	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
8d561bea-12d6-49fc-b83c-dfb7b6c7b66a	electronics	tr	Elektronik	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
501f96e3-6a7a-44e1-a03f-2bb0d2209fd0	clothing	tr	Giyim	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
0cd0a95c-7601-43fe-8b3b-bbe5d3478770	vehicles	tr	Araçlar	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
453978c6-76d9-4a4b-806f-bdbc44ac4f95	collectibles	tr	Koleksiyonlar	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
be6cd0aa-5f15-4c69-8b46-9dc692ec1d10	electronics	ur	الیکٹرانکس	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
52191281-5a33-48e1-9ab1-531632e25063	clothing	ur	لباس	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
84142894-87c6-4067-baa9-fee53f5dd56f	home	ar	المنزل والحديقة	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
a8e8005d-c8b7-406b-aa44-9bf7d5ab3d23	books	de	Bücher & Medien	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
5e316457-0c91-4e67-a675-bae0e3cb8f8a	books	es	Libros y Medios	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
5f48fc66-d50d-4a91-9fce-4bc433370ddd	home	fr	Maison et jardin	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
9bb06a25-7282-412e-9aaf-1d89a0a1391e	home	ja	ホーム&ガーデン	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
b0584434-7fb9-493b-87d3-86ac9bbb2502	home	zh	家居与园艺	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
96d01150-326c-4a1e-b3b8-2b53de136847	books	ar	الكتب والوسائط	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
efdfdad7-cf7d-4369-972d-9fed2a4bbc22	home	ko	홈 & 가든	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
ad3f15e2-a778-4a57-8a2f-9676ced84cbb	home	de	Haus & Garten	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
a0734727-e2cf-4e9f-9727-320660c88ac2	books	fr	Livres et médias	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
0c090eb2-d81e-41f6-9991-f07c64583fa1	books	ja	書籍とメディア	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
d9e2b389-05e6-4822-a4af-e4966f598100	books	zh	书籍与媒体	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
67025e49-eaad-4b79-8657-45a368e64c40	home	tl	Tahanan at Hardin	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
9621ed04-7e25-41eb-9635-73fba212c508	books	sv	Böcker & Media	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
4a20e592-4b79-4969-b7ea-97c6cd26ccfa	books	pt	Livros e Mídia	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
eed28920-8639-4487-9954-3cfe4417a15f	home	es	Hogar y Jardín	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
dd77c3df-11ef-4df5-bd54-405015730a5d	books	ko	도서 및 미디어	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
418a7999-befd-4757-87fd-c9df77a10f11	home	ru	Дом и сад	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
c947d319-029c-4a7b-bd26-088c238feee2	books	ru	Книги и медиа	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
32b96a77-07d7-46d7-962f-872f833452c5	home	hi	घर और बगीचा	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
96be5934-aa0d-454c-884d-f3310ae1868a	home	sv	Hem & Trädgård	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
ea4b29b4-cbe4-462d-9143-c0ed5a49b64d	books	tl	Mga Aklat at Media	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
12c8431b-084e-4bb4-91dc-9633071c80a8	home	tr	Ev ve Bahçe	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
d4f7b52f-21fb-41b5-91ef-717ecb383c41	books	tr	Kitaplar ve Medya	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
cb72ea29-958f-4e4d-ade9-cfb30af48d2c	vehicles	ur	گاڑیاں	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
70b95598-5ca6-4f98-bf99-1e319a81c76f	collectibles	ur	جمع کرنے والی چیزیں	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
89f67a5b-e8ad-4b3d-842e-9d62603fcf44	electronics	vi	Điện tử	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
d556e119-c50a-4adf-a48d-7a156481cbd1	clothing	vi	Quần áo	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
3cae3525-54b0-4765-9dd0-a5037faa149a	vehicles	vi	Xe cộ	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
e1e1acbf-8994-443c-9382-b70982f06fb7	collectibles	vi	Đồ sưu tầm	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
71c64cb3-8874-43e7-a6b6-b3afc609fb1b	books_other	fa	دیگر	auto	2026-05-11 00:10:23.912616-04	2026-05-11 00:10:23.912616-04
4dd7b868-a1fc-44fb-a83a-0d1ddf243882	books_other	ar	آخر	auto	2026-05-11 00:10:24.128889-04	2026-05-11 00:10:24.128889-04
778c1736-732a-42d0-a228-fa041aaffa25	books_other	de	Andere	auto	2026-05-11 00:10:24.425422-04	2026-05-11 00:10:24.425422-04
ce89ffa7-6a7f-44ca-b71d-10d1c6bfbac3	books_other	es	Otro	auto	2026-05-11 00:10:24.732146-04	2026-05-11 00:10:24.732146-04
d470d8df-cd72-4130-bfa4-46a342adf406	books_other	fr	Autre	auto	2026-05-11 00:10:24.909094-04	2026-05-11 00:10:24.909094-04
05709cc3-6e3f-40a0-8e28-2e3970f6a2e4	books_other	ja	他の	auto	2026-05-11 00:10:25.153626-04	2026-05-11 00:10:25.153626-04
83820883-35cf-4669-8689-d6dec323f504	books_other	zh	其他	auto	2026-05-11 00:10:25.508266-04	2026-05-11 00:10:25.508266-04
08306355-f6a1-46b6-999f-4bf7df09668d	clothing_other	fa	دیگر	auto	2026-05-11 00:10:25.843193-04	2026-05-11 00:10:25.843193-04
21088ce6-ed8a-4c74-b1d6-f49dc8490069	clothing_other	ar	آخر	auto	2026-05-11 00:10:26.02404-04	2026-05-11 00:10:26.02404-04
99a7de04-1a2b-41a9-a5a3-54edc32d85f0	clothing_other	de	Andere	auto	2026-05-11 00:10:26.204483-04	2026-05-11 00:10:26.204483-04
5ed2c415-aad8-43b2-8db6-107d2f53455a	clothing_other	es	Otro	auto	2026-05-11 00:10:26.391465-04	2026-05-11 00:10:26.391465-04
3e925b75-b54b-43f8-be1c-c6be610f3244	clothing_other	fr	Autre	auto	2026-05-11 00:10:26.57209-04	2026-05-11 00:10:26.57209-04
dcf8442e-292e-4aff-9db4-ba21f168c3e3	clothing_other	ja	他の	auto	2026-05-11 00:10:26.74777-04	2026-05-11 00:10:26.74777-04
c4b13e91-f80d-4382-ba86-2949da508370	clothing_other	zh	其他	auto	2026-05-11 00:10:26.91442-04	2026-05-11 00:10:26.91442-04
896d81c1-ec16-462b-beba-ab1637d3cb55	vehicles_other	fa	دیگر	auto	2026-05-11 00:10:27.123844-04	2026-05-11 00:10:27.123844-04
050ad7e6-79ee-4c52-bddf-a66d0d929acb	vehicles_other	ar	آخر	auto	2026-05-11 00:10:27.294043-04	2026-05-11 00:10:27.294043-04
de18de07-e42a-48db-b432-67f96670726d	vehicles_other	de	Andere	auto	2026-05-11 00:10:27.470497-04	2026-05-11 00:10:27.470497-04
3ace5590-813d-4802-b9f1-ff603890b5e8	vehicles_other	es	Otro	auto	2026-05-11 00:10:27.644343-04	2026-05-11 00:10:27.644343-04
d27c5b72-cdc8-4e78-91c1-d64616b9b481	vehicles_other	fr	Autre	auto	2026-05-11 00:10:27.827152-04	2026-05-11 00:10:27.827152-04
c37fcf0f-244d-4f98-9f92-2c5f1b5234f1	vehicles_other	ja	他の	auto	2026-05-11 00:10:28.037617-04	2026-05-11 00:10:28.037617-04
49814037-64af-488c-a777-3e8fbc002eb2	vehicles_other	zh	其他	auto	2026-05-11 00:10:28.229059-04	2026-05-11 00:10:28.229059-04
cbb09897-c444-4eec-a00b-b8cb7c81f418	home_other	fa	دیگر	auto	2026-05-11 00:10:28.437299-04	2026-05-11 00:10:28.437299-04
22fc894a-f7aa-4d22-b21e-c14062fb4939	home_other	ar	آخر	auto	2026-05-11 00:10:28.617223-04	2026-05-11 00:10:28.617223-04
180e60d8-ad28-454d-bffc-583ab8994d41	home_other	de	Andere	auto	2026-05-11 00:10:28.803203-04	2026-05-11 00:10:28.803203-04
85c1e5ec-d5e0-4de3-a26b-999a35a7161b	home_other	es	Otro	auto	2026-05-11 00:10:28.981181-04	2026-05-11 00:10:28.981181-04
cf4f05cc-6cae-4864-8c8e-f7947a1cda4a	home_other	fr	Autre	auto	2026-05-11 00:10:29.180492-04	2026-05-11 00:10:29.180492-04
3a280cee-e630-4cdc-8c17-5ad9b7574f76	home_other	ja	他の	auto	2026-05-11 00:10:29.359903-04	2026-05-11 00:10:29.359903-04
06a7fcdd-c82a-43d7-b9bd-738f402b6666	home_other	zh	其他	auto	2026-05-11 00:10:29.549221-04	2026-05-11 00:10:29.549221-04
27d76087-ca5b-4135-b4e4-bbc713c2d6b0	collectibles_other	fa	دیگر	auto	2026-05-11 00:10:29.759272-04	2026-05-11 00:10:29.759272-04
992d9021-f444-4593-bd00-ee8e4a23b94b	collectibles_other	ar	آخر	auto	2026-05-11 00:10:29.966789-04	2026-05-11 00:10:29.966789-04
3a729123-69ea-4e54-adac-fb99ab82c284	collectibles_other	de	Andere	auto	2026-05-11 00:10:30.161283-04	2026-05-11 00:10:30.161283-04
d4040108-4f62-4bc1-9f1e-2a02158cdd05	collectibles_other	es	Otro	auto	2026-05-11 00:10:30.442742-04	2026-05-11 00:10:30.442742-04
660ca07e-c615-4924-be97-d3c9c06899a6	collectibles_other	fr	Autre	auto	2026-05-11 00:10:30.683725-04	2026-05-11 00:10:30.683725-04
f1542677-d605-47a0-b379-68ab7556bc2b	collectibles_other	ja	他の	auto	2026-05-11 00:10:30.914471-04	2026-05-11 00:10:30.914471-04
15559fe6-7d91-4ecb-b9a1-6883188f8d18	collectibles_other	zh	其他	auto	2026-05-11 00:10:31.092549-04	2026-05-11 00:10:31.092549-04
81091c72-3af8-4d45-87c8-b144541d5d08	electronics_other	fa	دیگر	auto	2026-05-11 00:10:31.361036-04	2026-05-11 00:10:31.361036-04
801e4628-238a-4bf8-b323-19443fb52b58	electronics_other	ar	آخر	auto	2026-05-11 00:10:31.623907-04	2026-05-11 00:10:31.623907-04
b8b6878f-9447-482d-9e54-a6dec68ec7e0	electronics_other	de	Andere	auto	2026-05-11 00:10:31.906997-04	2026-05-11 00:10:31.906997-04
6175721f-b7f5-426f-9ef5-a0fb020a3918	electronics_other	es	Otro	auto	2026-05-11 00:10:32.25216-04	2026-05-11 00:10:32.25216-04
63493cbd-6522-4312-845d-f1165b871b3b	electronics_other	fr	Autre	auto	2026-05-11 00:10:32.528572-04	2026-05-11 00:10:32.528572-04
11aff285-0508-4b87-9ae5-19ca729fb085	electronics_other	ja	他の	auto	2026-05-11 00:10:32.748436-04	2026-05-11 00:10:32.748436-04
12fd5f2f-a2c5-48c2-8258-fd6bc8908567	electronics_other	zh	其他	auto	2026-05-11 00:10:32.998274-04	2026-05-11 00:10:32.998274-04
5a0e4a6d-5580-4b51-875b-32969f867659	clothing_other	ko	다른	auto	2026-05-11 00:51:41.702766-04	2026-05-11 00:51:41.702766-04
cb7df6a6-a02c-4483-aec7-98025d978b8c	home_other	ko	다른	auto	2026-05-11 00:51:42.015073-04	2026-05-11 00:51:42.015073-04
52b2ab6c-e7af-4270-a050-40a1c1af23c2	other	fa	دیگر	auto	2026-05-11 00:16:47.952931-04	2026-05-11 00:16:47.952931-04
131f2f69-097e-4e25-ae16-6d06c24df609	other	ar	آخر	auto	2026-05-11 00:16:48.234278-04	2026-05-11 00:16:48.234278-04
b035df66-6af9-4dc7-a1e8-3bfc69699203	other	de	Andere	auto	2026-05-11 00:16:48.469602-04	2026-05-11 00:16:48.469602-04
9ee616e8-ba86-437b-a0ed-e41a2dc502d2	other	es	Otro	auto	2026-05-11 00:16:48.730251-04	2026-05-11 00:16:48.730251-04
e10d6d41-69d1-40ac-9f63-1714c9091c76	other	fr	Autre	auto	2026-05-11 00:16:48.940391-04	2026-05-11 00:16:48.940391-04
f93159b6-5008-498d-808e-9595ea241830	other	ja	他の	auto	2026-05-11 00:16:49.209354-04	2026-05-11 00:16:49.209354-04
065b28bc-682d-4070-be06-9df85bde4f76	other	zh	其他	auto	2026-05-11 00:16:49.387813-04	2026-05-11 00:16:49.387813-04
ee228614-9358-4faa-a882-aa99e53f3c16	other	ko	다른	auto	2026-05-11 00:16:49.58689-04	2026-05-11 00:16:49.58689-04
97996506-c5af-412e-ba5e-23f99e4ed74a	other	ru	Другой	auto	2026-05-11 00:16:50.137507-04	2026-05-11 00:16:50.137507-04
745a75e9-0f8d-4950-a84f-670db54d794a	other	pt	Outro	auto	2026-05-11 00:16:50.37847-04	2026-05-11 00:16:50.37847-04
dc61ea2f-7e68-49ea-86d9-e40916bd72a8	other	hi	अन्य	auto	2026-05-11 00:16:50.562137-04	2026-05-11 00:16:50.562137-04
bb45ac40-0ceb-44ab-9579-f3594debb676	other	sv	Andra	auto	2026-05-11 00:16:50.740405-04	2026-05-11 00:16:50.740405-04
f344096c-1894-4297-a9b3-811cbe088046	other	tl	Iba pa	auto	2026-05-11 00:16:50.916614-04	2026-05-11 00:16:50.916614-04
7a4d8325-f867-43b6-a7df-52dfbe9ae74d	other	tr	Diğer	auto	2026-05-11 00:16:51.100803-04	2026-05-11 00:16:51.100803-04
02f32a53-1917-4eb1-bc37-7430e7adef7e	other	ur	دیگر	auto	2026-05-11 00:16:51.285353-04	2026-05-11 00:16:51.285353-04
7b1f422f-df16-48fd-9633-1baf62464864	other	vi	Khác	auto	2026-05-11 00:16:51.444165-04	2026-05-11 00:16:51.444165-04
e89230fe-72d7-46eb-93b3-c447b6c3d031	books	fa	کتاب و رسانه	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
6834de85-1d28-4633-b21d-ef8eb209eaf0	home	fa	خانه و باغ	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
a6b26e60-e9b4-4f23-97bd-1b6564425eca	clothing_other	hi	अन्य	auto	2026-05-11 00:51:38.938522-04	2026-05-11 00:51:38.938522-04
fa4324bb-884d-4aeb-9b52-d9703eb3b89c	home_other	hi	अन्य	auto	2026-05-11 00:51:39.265881-04	2026-05-11 00:51:39.265881-04
a22b64fd-3171-4a52-a3a1-07113332691a	books_other	hi	अन्य	auto	2026-05-11 00:51:39.656778-04	2026-05-11 00:51:39.656778-04
9a83cfd5-a3de-44ad-8754-1a0487f63542	vehicles_other	hi	अन्य	auto	2026-05-11 00:51:39.957991-04	2026-05-11 00:51:39.957991-04
565f7bca-53a5-4044-bfe0-c68d20a8a49d	collectibles_other	hi	अन्य	auto	2026-05-11 00:51:40.373799-04	2026-05-11 00:51:40.373799-04
cf1bcedb-940c-4c73-acdf-b44997d13761	electronics_other	hi	अन्य	auto	2026-05-11 00:51:40.785495-04	2026-05-11 00:51:40.785495-04
d51d86f2-93a6-4d01-98a0-75fe8262687e	books_other	ko	다른	auto	2026-05-11 00:51:42.241733-04	2026-05-11 00:51:42.241733-04
ff6b4aa6-7b42-44d7-a2a5-bb437829cc88	vehicles_other	ko	다른	auto	2026-05-11 00:51:42.451585-04	2026-05-11 00:51:42.451585-04
3e0eeede-8316-4b0d-b385-fdd14dfc37df	collectibles_other	ko	다른	auto	2026-05-11 00:51:42.662452-04	2026-05-11 00:51:42.662452-04
8e6ee0cc-1368-4d79-98c2-61dac6eec634	electronics_other	ko	다른	auto	2026-05-11 00:51:42.975261-04	2026-05-11 00:51:42.975261-04
a056a169-9598-489a-83e3-74e640e0caaf	clothing_other	pt	Outro	auto	2026-05-11 00:51:43.372152-04	2026-05-11 00:51:43.372152-04
0cd9ce42-8175-4568-9477-d2a8d99fd5d5	home_other	pt	Outro	auto	2026-05-11 00:51:43.575261-04	2026-05-11 00:51:43.575261-04
3af67f5f-efa4-4719-b4a0-378bb2ca0cb9	books_other	pt	Outro	auto	2026-05-11 00:51:43.772274-04	2026-05-11 00:51:43.772274-04
652179b2-d535-42e9-abb0-af69d278a648	vehicles_other	pt	Outro	auto	2026-05-11 00:51:43.957579-04	2026-05-11 00:51:43.957579-04
18c89211-9ba9-4736-9d3d-e41be3ad8420	collectibles_other	pt	Outro	auto	2026-05-11 00:51:44.197226-04	2026-05-11 00:51:44.197226-04
779f28c5-3722-4200-8dc1-1ba20f9d30c6	home	vi	Nhà và Vườn	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
be2db93b-fdff-4d30-98b6-9717d31fcb79	books	vi	Sách và Truyền thông	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
b06db9f8-b3d4-4c4f-82a4-3bb776b06383	electronics_other	pt	Outro	auto	2026-05-11 00:51:44.414426-04	2026-05-11 00:51:44.414426-04
57678425-af06-49c1-a485-ea97b02ba761	clothing_other	ru	Другой	auto	2026-05-11 00:51:44.788164-04	2026-05-11 00:51:44.788164-04
725f9065-b503-4726-a3d8-36c3c9adde3e	home_other	ru	Другой	auto	2026-05-11 00:51:45.00989-04	2026-05-11 00:51:45.00989-04
0f0dffee-5d6d-4580-abc1-8d92500e831a	books_other	ru	Другой	auto	2026-05-11 00:51:45.25877-04	2026-05-11 00:51:45.25877-04
1fe6aa1a-4f8d-4de4-839a-972f67fc9246	vehicles_other	ru	Другой	auto	2026-05-11 00:51:45.580219-04	2026-05-11 00:51:45.580219-04
c906e112-1ea6-4724-9acf-2b0be93b5424	collectibles_other	ru	Другой	auto	2026-05-11 00:51:45.797036-04	2026-05-11 00:51:45.797036-04
549dafde-4427-4f57-a7c9-bab5949c0251	electronics_other	ru	Другой	auto	2026-05-11 00:51:46.000634-04	2026-05-11 00:51:46.000634-04
2f7003b1-2fba-4223-968a-c109ff8b94be	clothing_other	sv	Andra	auto	2026-05-11 00:51:46.400619-04	2026-05-11 00:51:46.400619-04
8ddaeec1-4762-4417-8e1e-d3bd800fe12e	home_other	sv	Andra	auto	2026-05-11 00:51:46.614068-04	2026-05-11 00:51:46.614068-04
4a55e212-8c72-4970-a887-2f68f52c7eca	books_other	sv	Andra	auto	2026-05-11 00:51:46.830772-04	2026-05-11 00:51:46.830772-04
7ffe8853-b8d3-4ab9-81aa-0b8c151f37c4	vehicles_other	sv	Andra	auto	2026-05-11 00:51:47.042841-04	2026-05-11 00:51:47.042841-04
c0220182-e4e8-47ac-82ea-ef4cd9c07c5b	collectibles_other	sv	Andra	auto	2026-05-11 00:51:47.254728-04	2026-05-11 00:51:47.254728-04
ce59c2bf-ff0e-431e-8499-d64d2e19948d	electronics_other	sv	Andra	auto	2026-05-11 00:51:47.486122-04	2026-05-11 00:51:47.486122-04
a5398d93-a7f7-4ef6-8a31-2ae9b5498d65	clothing_other	tl	Iba pa	auto	2026-05-11 00:51:47.889575-04	2026-05-11 00:51:47.889575-04
2b2ae2b8-33a6-4e6c-91fe-2a8adacd0b1c	home_other	tl	Iba pa	auto	2026-05-11 00:51:48.094408-04	2026-05-11 00:51:48.094408-04
fbf4ad09-d509-48ec-add0-35f7e5d4e898	books_other	tl	Iba pa	auto	2026-05-11 00:51:48.296853-04	2026-05-11 00:51:48.296853-04
dcbdad56-a423-4d29-bff9-813be5f2e10b	vehicles_other	tl	Iba pa	auto	2026-05-11 00:51:48.504004-04	2026-05-11 00:51:48.504004-04
1c5dad24-a320-40b8-9643-fc5a054b9e8f	collectibles_other	tl	Iba pa	auto	2026-05-11 00:51:48.711203-04	2026-05-11 00:51:48.711203-04
972acd7c-4fcd-43f9-a6f3-bf680c6fcc59	electronics_other	tl	Iba pa	auto	2026-05-11 00:51:48.9638-04	2026-05-11 00:51:48.9638-04
c7dad530-9f0c-48b0-838c-3a92bc6043a6	clothing_other	tr	Diğer	auto	2026-05-11 00:51:49.392873-04	2026-05-11 00:51:49.392873-04
2208e3eb-83c7-4aef-ad8b-b5acbc17198d	home_other	tr	Diğer	auto	2026-05-11 00:51:49.760251-04	2026-05-11 00:51:49.760251-04
7c6f30a5-6bc3-4214-9a42-309894c7695e	books_other	tr	Diğer	auto	2026-05-11 00:51:49.968549-04	2026-05-11 00:51:49.968549-04
a5528250-7647-4c75-8103-ea2011ef3a8c	vehicles_other	tr	Diğer	auto	2026-05-11 00:51:50.189405-04	2026-05-11 00:51:50.189405-04
92890a2f-34b6-408b-b892-4d92d7fe86f3	collectibles_other	tr	Diğer	auto	2026-05-11 00:51:50.399286-04	2026-05-11 00:51:50.399286-04
519de203-6d6d-42a9-ae4c-a49ef5f5accc	electronics_other	tr	Diğer	auto	2026-05-11 00:51:50.612929-04	2026-05-11 00:51:50.612929-04
7298d912-082d-4cf7-974b-88ffb5f3a342	clothing_other	ur	دیگر	auto	2026-05-11 00:51:50.983925-04	2026-05-11 00:51:50.983925-04
38d20628-7dbf-4499-854d-46bfe38821f2	home_other	ur	دیگر	auto	2026-05-11 00:51:51.176545-04	2026-05-11 00:51:51.176545-04
5e2a5a36-5c73-40e4-90d0-d1fbe3293ea1	books_other	ur	دیگر	auto	2026-05-11 00:51:51.369581-04	2026-05-11 00:51:51.369581-04
45859041-2b42-48ee-9e8b-9299fe673d2e	vehicles_other	ur	دیگر	auto	2026-05-11 00:51:51.568979-04	2026-05-11 00:51:51.568979-04
7815e8d4-6a8c-4022-934a-ba8f1ac5c663	collectibles_other	ur	دیگر	auto	2026-05-11 00:51:51.782562-04	2026-05-11 00:51:51.782562-04
98d46b63-de75-4ecf-a5bf-30fd4bb37612	electronics_other	ur	دیگر	auto	2026-05-11 00:51:51.989069-04	2026-05-11 00:51:51.989069-04
c1701ca1-7857-458f-b6e3-4517840078c1	clothing_other	vi	Khác	auto	2026-05-11 00:51:52.363898-04	2026-05-11 00:51:52.363898-04
b03c52e8-3cff-4ccc-9ceb-d19306ca7327	home_other	vi	Khác	auto	2026-05-11 00:51:52.560291-04	2026-05-11 00:51:52.560291-04
79f6d62d-44cc-4252-82fd-c2dfadfe40f2	books_other	vi	Khác	auto	2026-05-11 00:51:52.760868-04	2026-05-11 00:51:52.760868-04
94df1dc0-8577-4d99-8e09-aec7c7e24d90	vehicles_other	vi	Khác	auto	2026-05-11 00:51:52.952981-04	2026-05-11 00:51:52.952981-04
9f53e274-b611-417c-a671-bd1133d21601	collectibles_other	vi	Khác	auto	2026-05-11 00:51:53.171056-04	2026-05-11 00:51:53.171056-04
c4a289a5-d1d2-46ae-be5f-fe71cc480a0f	electronics_other	vi	Khác	auto	2026-05-11 00:51:53.36804-04	2026-05-11 00:51:53.36804-04
67999231-181c-496d-a85b-011ca2341a77	home	pt	Casa e Jardim	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
fc0ab3fc-96df-4c3f-8827-a12b4f921c50	home	it	Casa e Giardino	auto	2026-05-11 01:31:47.684262-04	2026-05-11 01:31:47.684262-04
d3ac207e-2bf5-4fa4-b8ae-20dd23893610	books	it	Libri e Media	auto	2026-05-11 01:31:47.712223-04	2026-05-11 01:31:47.712223-04
0c8b05d0-a506-4e2d-a107-dc58ebc05fd1	home	nl	Huis & Tuin	auto	2026-05-11 01:31:47.751878-04	2026-05-11 01:31:47.751878-04
fdc94f17-decc-400d-9919-20163d49ba01	books	nl	Boeken & Media	auto	2026-05-11 01:31:47.781914-04	2026-05-11 01:31:47.781914-04
a29bf77d-2ff8-4b4a-9c0f-aecc61c0683e	books	hi	किताबें और मीडिया	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
1dcb592a-77c4-4d93-9175-5328ea8d073d	home	ur	گھر اور باغ	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
a03e2199-c2f8-497e-8402-e9223f7586ab	books	ur	کتابیں اور میڈیا	auto	2026-05-11 00:09:21.62361-04	2026-05-11 00:09:21.62361-04
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: heavenslive
--

COPY public.users (id, email, password_hash, full_name, whatsapp_number, is_super_admin, is_suspended, suspension_end_date, suspension_reason, created_at, updated_at, last_login, email_verified, email_verification_token, password_reset_token, password_reset_expires, purchase_count, is_active, last_mandatory_2fa, referral_code, referred_by, join_reason, credon_approved, credon_pending, total_referrals, affiliate_balance_cents, total_affiliate_earned_cents, subscription_plan) FROM stdin;
4d189885-f836-485c-9cee-f779c4b35c15	testuser@example.com	$2b$10$nRqoDZ/WEPgdbgn.cPBCNe1K5SmvLuVr3AaT7ek.ezxC9cqD7pPUK	Test User	\N	f	f	\N	\N	2026-03-30 14:33:13.083593	2026-05-11 05:08:33.51379	\N	f	b26f4b8d-877d-4edb-bd25-b27479454bf3	\N	\N	0	t	\N	b2d2c494	\N	\N	f	f	0	0	0	pro
e6cf0d07-3a9c-4e29-88f5-70838725a138	bryanjbenevolence@gmail.com	$2b$10$ds7DJuYQAM1jhSb9uJAClODnxHW7l8CNblI9yTocq7BCowDoYz/8m	Bryan J Benevolence		f	f	\N	\N	2026-03-30 14:35:41.095888	2026-05-10 23:02:45.076223	2026-03-30 14:35:57.394723	f	ece95423-273d-4f92-b2b5-5efe94e6c584	\N	\N	0	t	\N	8ce6ad0e	\N	\N	f	f	0	0	0	pro
746ee413-2284-478e-8fef-0f4b10ed1dab	testref@test.com	$2b$12$Zrwf/DpE7XpVwD5dcH34c.y5yD03j.bEP793TNDetixTfQyOAmX/S	\N	\N	f	f	\N	\N	2026-05-10 18:05:06.413906	2026-05-10 23:02:45.076223	\N	f	4099d7e1637b973bc12126aae17dd44aecb2848e88018cd10372ba308fa30493	\N	\N	0	t	\N	\N	3900aa10-2769-4646-9390-084a5b56f5f9	I want to test the marketplace	f	f	0	0	0	pro
3a9e1963-1395-46f7-bd12-afdd26ab8c8d	finaltest@test.com	$2b$12$1MGYcD/cgitoaBxk6XYvC.mI/GieMjSlbYl./GxP65cmOj4YHaSbm	\N	\N	f	f	\N	\N	2026-05-10 18:07:22.522223	2026-05-10 23:02:45.076223	\N	f	18fc0a864293e156fd3a3d66ddaf0c39faca352a4ebbb3601b3bafa9b146bd82	\N	\N	0	t	\N	\N	3900aa10-2769-4646-9390-084a5b56f5f9	Marketplace testing	f	f	0	0	0	pro
3900aa10-2769-4646-9390-084a5b56f5f9	bmirkalami@gmail.com	$2b$12$pu2STH3EtJHCIVc7x20rmuWTFX1616ZYjSURh.u/ZAzVXRsCYaZxK	Super Admin	\N	t	f	\N	\N	2026-03-30 05:31:01.616098	2026-05-10 23:02:45.076223	2026-03-31 04:38:59.475024	t	\N	\N	\N	0	t	2026-05-09 22:53:00.311743-04	39669028	\N	\N	t	f	0	0	0	pro
\.


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: heavenslive
--

COPY public.stores (id, seller_id, store_name, slug, description, logo_url, banner_url, custom_domain, is_custom_domain_verified, is_active, store_settings, created_at, updated_at, paypal_email, return_policy, shipping_policy, processing_time_days, settings, theme_color, secondary_color, text_color, font_family, layout_style, show_seller_info) FROM stdin;
aa61d1c6-a56b-4775-887f-53576a8bd43b	3900aa10-2769-4646-9390-084a5b56f5f9	Bryans Marketplace	bryans-marketplace	Curated goods from around the world	\N	\N	\N	f	t	{"allow_offers": true, "return_policy": "", "shipping_zones": [], "processing_time_days": 2}	2026-05-10 16:46:32.294698	2026-05-10 16:46:32.294698	\N	\N	\N	2	{"accept_offers": true, "vacation_mode": false, "shipping_zones": [], "vacation_message": "", "auto_approve_offers": false, "minimum_offer_percent": 50}	#0b1f3f	#ffd700	#f5f5f5	Arial, sans-serif	grid	t
\.


--
-- Data for Name: listings; Type: TABLE DATA; Schema: public; Owner: heavenslive
--

COPY public.listings (id, seller_id, store_id, type, title, description, category, price_cents, starting_price_cents, reserve_price_cents, buy_it_now_price_cents, current_bid_cents, bid_increment_cents, reverse_target_specs, quantity_available, quantity_sold, images, video_url, location_city, location_state, location_country, latitude, longitude, is_local_pickup, shipping_options, inventory_tracking, status, approved_by, approved_at, auction_end_time, created_at, updated_at, duration, expires_at, min_bid_cents, max_bid_cents, bid_increment_percent, current_bidder_id, bid_count, shipping_provider, shipping_tracking, weight_oz, dimensions, deleted_at, deletion_reason, is_dutch_auction, dutch_clearing_price_cents, allow_local_pickup, pickup_address, pickup_city, pickup_state, pickup_zip, pickup_instructions, pickup_country, poster_role, item_condition, is_featured, source_language, currency, accepted_currencies) FROM stdin;
13dcabf9-a6a4-4636-9cfa-164ea320907d	3900aa10-2769-4646-9390-084a5b56f5f9	\N	mall	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	electronics	89900	\N	\N	\N	\N	100	\N	1	0	\N	\N	Toronto	ON	CA	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-09 22:24:38.572368	2026-05-09 22:24:38.572368	2weeks	\N	\N	\N	10	\N	0	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	CA	seller	new	f	en	USD	{USD}
2d6ebb49-30ac-4c35-8845-37cf1ba9de86	3900aa10-2769-4646-9390-084a5b56f5f9	\N	classifieds	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	clothing	29900	\N	\N	\N	\N	100	\N	1	0	\N	\N	Montreal	QC	CA	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-09 22:24:38.572368	2026-05-09 22:24:38.572368	2weeks	\N	\N	\N	10	\N	0	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	CA	seller	new	f	en	USD	{USD}
5b2dd77a-683f-413f-871c-3a183663c837	3900aa10-2769-4646-9390-084a5b56f5f9	\N	mall	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	electronics	349900	\N	\N	\N	\N	100	\N	1	0	\N	\N	San Francisco	CA	US	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-09 22:24:38.572368	2026-05-09 22:24:38.572368	2weeks	\N	\N	\N	10	\N	0	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	CA	seller	new	t	en	USD	{USD}
a2408246-7d13-4d2b-9eea-040f942e0a69	3900aa10-2769-4646-9390-084a5b56f5f9	\N	mall	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	electronics	45000	\N	\N	\N	\N	100	\N	1	0	\N	\N	Calgary	AB	CA	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-09 22:24:38.572368	2026-05-09 22:24:38.572368	2weeks	\N	\N	\N	10	\N	0	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	CA	seller	new	f	en	USD	{USD}
5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	3900aa10-2769-4646-9390-084a5b56f5f9	\N	auction	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	collectibles	820000	\N	\N	\N	\N	100	\N	1	0	\N	\N	Vancouver	BC	CA	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-09 22:24:38.572368	2026-05-09 22:24:38.572368	2weeks	\N	820000	\N	10	\N	0	\N	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N	CA	seller	new	f	en	USD	{USD}
3e170287-9b34-42fc-a3f6-cbc29aff1db6	3900aa10-2769-4646-9390-084a5b56f5f9	\N	mall	Un nuevo iPhone 15 Pro Max	Como nuevo, con caja original y AppleCare+	electronics	89900	\N	\N	\N	\N	100	\N	1	0	\N	\N	Madrid	\N	ES	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-10 01:22:51.589932	2026-05-10 01:22:51.589932	2weeks	\N	\N	\N	10	\N	0	\N	\N	\N	{}	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	seller	new	f	en	USD	{USD}
6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	3900aa10-2769-4646-9390-084a5b56f5f9	\N	mall	آیفون ۱۵ پرو مکس جدید	در حد نو، با جعبه اصلی و اپل کر	electronics	89900	\N	\N	\N	\N	100	\N	1	0	\N	\N	Tehran	\N	IR	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-10 01:22:52.495113	2026-05-10 01:22:52.495113	2weeks	\N	\N	\N	10	\N	0	\N	\N	\N	{}	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	seller	new	f	en	USD	{USD}
9b036601-ffa4-40d6-b8ce-b23663f4282d	3900aa10-2769-4646-9390-084a5b56f5f9	\N	classifieds	Nouveau MacBook Pro M3	64 Go RAM, 2 To SSD, noir sidéral	electronics	349900	\N	\N	\N	\N	100	\N	1	0	\N	\N	Paris	\N	FR	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-10 01:22:53.00726	2026-05-10 01:22:53.00726	2weeks	\N	\N	\N	10	\N	0	\N	\N	\N	{}	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	seller	new	f	en	USD	{USD}
9878222b-8d19-47d2-90ed-fcdc31ce9d48	3900aa10-2769-4646-9390-084a5b56f5f9	\N	mall	新しいPS5デジタルエディション	新品未開封、コントローラー2個付き	electronics	45000	\N	\N	\N	\N	100	\N	1	0	\N	\N	Tokyo	\N	JP	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-10 01:22:53.515547	2026-05-10 01:22:53.515547	2weeks	\N	\N	\N	10	\N	0	\N	\N	\N	{}	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	seller	new	f	en	USD	{USD}
07f04923-8e6e-42ad-8f73-05faf24d3bcf	3900aa10-2769-4646-9390-084a5b56f5f9	\N	classifieds	Điện thoại Samsung Galaxy S24 mới	Còn nguyên hộp, bảo hành 12 tháng	electronics	79900	\N	\N	\N	\N	100	\N	1	0	\N	\N	Hanoi	\N	VN	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-10 01:22:54.237035	2026-05-10 01:22:54.237035	2weeks	\N	\N	\N	10	\N	0	\N	\N	\N	{}	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	seller	new	f	en	USD	{USD}
4456157c-9ed0-4afd-8ffe-08dde788e6a0	3900aa10-2769-4646-9390-084a5b56f5f9	\N	mall	Vintage Record Player - Technics SL-1200	Fully restored, new cartridge, sounds amazing	electronics	49900	\N	\N	\N	\N	100	\N	1	0	\N	\N	London	\N	GB	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-10 01:22:54.654835	2026-05-10 01:22:54.654835	2weeks	\N	\N	\N	10	\N	0	\N	\N	\N	{}	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	seller	new	f	en	USD	{USD}
3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	3900aa10-2769-4646-9390-084a5b56f5f9	\N	classifieds	Handmade Leather Messenger Bag	Full grain leather, brass hardware, hand-stitched	clothing	18900	\N	\N	\N	\N	100	\N	1	0	\N	\N	New York	\N	US	\N	\N	f	[]	\N	active	\N	\N	\N	2026-05-10 01:22:55.267717	2026-05-10 01:22:55.267717	2weeks	\N	\N	\N	10	\N	0	\N	\N	\N	{}	\N	\N	f	\N	f	\N	\N	\N	\N	\N	\N	seller	new	f	en	USD	{USD}
\.


--
-- Data for Name: listing_translations; Type: TABLE DATA; Schema: public; Owner: heavenslive
--

COPY public.listing_translations (id, listing_id, language_code, title, description, translated_by, created_at, updated_at, search_vector) FROM stdin;
80cde53f-36ec-4bcc-867d-6b47b00fa06d	3e170287-9b34-42fc-a3f6-cbc29aff1db6	ar	ايفون 15 برو ماكس جديد	كجديد، مع الصندوق الأصلي وAppleCare+	auto	2026-05-10 01:22:53.62481-04	2026-05-10 01:22:53.62481-04	'15':2A 'الأصلي':9B 'الصندوق':8B 'ايفون':1A 'برو':3A 'جديد':5A 'كجديد':6B 'ماكس':4A 'مع':7B 'وapplecar':10B
cc7e9e28-788a-4ce6-9a90-ca185a84b5f9	9b036601-ffa4-40d6-b8ce-b23663f4282d	ar	نوفو ماك بوك برو M3	64 Go RAM، 2 إلى SSD، أسود	auto	2026-05-10 01:22:54.662409-04	2026-05-10 01:22:54.662409-04	'2':9B '64':6B 'go':7B 'm3':5A 'ram':8B 'ssd':11B 'أسود':12B 'إلى':10B 'برو':4A 'بوك':3A 'ماك':2A 'نوفو':1A
dd8629ff-d7cc-4e72-811f-1c81b2018ada	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	de	Neues iPhone 15 Pro Mix	Drehen Sie sich um, mit Ihrem Originalköcher und Ihrem Apfel	auto	2026-05-10 01:22:55.151385-04	2026-05-10 01:22:55.151385-04	'15':3A 'apfel':15B 'drehen':6B 'ihrem':11B,14B 'iphon':2A 'mit':10B 'mix':5A 'neue':1A 'originalköch':12B 'pro':4A 'sich':8B 'sie':7B 'um':9B 'und':13B
bcbd90c4-5f16-4ed5-9fa2-5ff8e2e0ce94	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	en	New iPhone 15 Pro Mix	Turn around, with your original quiver and your apple	auto	2026-05-10 01:22:55.371246-04	2026-05-10 01:22:55.371246-04	'15':3A 'appl':14B 'around':7B 'iphon':2A 'mix':5A 'new':1A 'origin':10B 'pro':4A 'quiver':11B 'turn':6B
f28a5913-e37d-4c49-b180-7cf735845ea2	4456157c-9ed0-4afd-8ffe-08dde788e6a0	ar	مشغل تسجيل عتيق - تكنيكس SL-1200	خرطوشة جديدة تمت استعادتها بالكامل، تبدو مذهلة	auto	2026-05-10 01:22:55.68317-04	2026-05-10 01:22:55.68317-04	'-1200':6A 'sl':5A 'استعادتها':10B 'بالكامل':11B 'تبدو':12B 'تسجيل':2A 'تكنيكس':4A 'تمت':9B 'جديدة':8B 'خرطوشة':7B 'عتيق':3A 'مذهلة':13B 'مشغل':1A
b83ca20c-5038-48a2-9208-2fc669651e9a	07f04923-8e6e-42ad-8f73-05faf24d3bcf	ar	هذا هو هاتف Samsung Galaxy S24	Còn nguyên hộp، قبل 12 شهرًا	auto	2026-05-10 01:22:55.688795-04	2026-05-10 01:22:55.688795-04	'12':11B 'còn':7B 'galaxi':5A 'hộp':9B 'nguyên':8B 's24':6A 'samsung':4A 'شهرًا':12B 'قبل':10B 'هاتف':3A 'هذا':1A 'هو':2A
4eac1c6a-ed14-4904-a10d-2dc95d4a66fe	3e170287-9b34-42fc-a3f6-cbc29aff1db6	de	Ein neues iPhone 15 Pro Max	Wie neu, mit Originalverpackung und AppleCare+	auto	2026-05-10 01:22:55.833968-04	2026-05-10 01:22:55.833968-04	'15':4A 'applecar':12B 'ein':1A 'iphon':3A 'max':6A 'mit':9B 'neu':8B 'neue':2A 'originalverpackung':10B 'pro':5A 'und':11B 'wie':7B
ea352aa4-c3e0-435f-a16f-0f79c036bc60	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	es	Nueva mezcla de iPhone 15 Pro	Date la vuelta, con tu aljaba original y tu manzana.	auto	2026-05-10 01:22:55.939644-04	2026-05-10 01:22:55.939644-04	'15':5A 'aljaba':12B 'con':10B 'date':7B 'de':3A 'iphon':4A 'la':8B 'manzana':16B 'mezcla':2A 'nueva':1A 'origin':13B 'pro':6A 'tu':11B,15B 'vuelta':9B 'y':14B
e049101f-783a-4e52-9c95-b6648c59d15f	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	ar	حقيبة رسول جلدية مصنوعة يدويا	جلد محبب بالكامل، أجزاء صلبة من النحاس، مخيطة يدويًا	auto	2026-05-10 01:22:56.110309-04	2026-05-10 01:22:56.110309-04	'أجزاء':9B 'النحاس':12B 'بالكامل':8B 'جلد':6B 'جلدية':3A 'حقيبة':1A 'رسول':2A 'صلبة':10B 'محبب':7B 'مخيطة':13B 'مصنوعة':4A 'من':11B 'يدويا':5A 'يدويًا':14B
79c22318-7f26-4638-b1d8-511a459c6952	9878222b-8d19-47d2-90ed-fcdc31ce9d48	ar	أحدث إصدار من PS5	منتج جديد، غير مفتوح، 2 قطعة من CONTRON	auto	2026-05-10 01:22:56.158007-04	2026-05-10 01:22:56.158007-04	'2':9B 'contron':12B 'ps5':4A 'أحدث':1A 'إصدار':2A 'جديد':6B 'غير':7B 'قطعة':10B 'مفتوح':8B 'من':3A,11B 'منتج':5B
9b3acb3b-ce4d-497d-a072-442177474ba6	9b036601-ffa4-40d6-b8ce-b23663f4282d	de	Neues MacBook Pro M3	64 Go RAM, 2 To SSD, schwarze Seite	auto	2026-05-10 01:22:56.558246-04	2026-05-10 01:22:56.558246-04	'2':8B '64':5B 'go':6B 'm3':4A 'macbook':2A 'neue':1A 'pro':3A 'ram':7B 'schwarz':11B 'seit':12B 'ssd':10B
d7042a8a-a0f8-4bbc-a5d9-76ee62b16e48	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	fa	آیفون 15 پرو میکس جدید	به دور خود بچرخید، با کتک اصلی و سیب خود	auto	2026-05-10 01:22:57.026322-04	2026-05-10 01:22:57.026322-04	'15':2A 'آیفون':1A 'اصلی':12B 'با':10B 'به':6B 'بچرخید':9B 'جدید':5A 'خود':8B,15B 'دور':7B 'سیب':14B 'میکس':4A 'و':13B 'پرو':3A 'کتک':11B
e514f784-c42b-4460-85e8-5657da3e365d	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	de	Handgefertigte Umhängetasche aus Leder	Vollnarbenleder, Messingbeschläge, handgenäht	auto	2026-05-10 01:22:57.36787-04	2026-05-10 01:22:57.36787-04	'aus':3A 'handgefertigt':1A 'handgenäht':7B 'leder':4A 'messingbeschläg':6B 'umhängetasch':2A 'vollnarbenled':5B
993adfbd-b910-4a0f-afc1-d37b854d9955	3e170287-9b34-42fc-a3f6-cbc29aff1db6	fa	جدید آیفون 15 پرو مکس	Como nuevo، با AppleCare+	auto	2026-05-10 01:22:57.64049-04	2026-05-10 01:22:57.64049-04	'15':3A 'applecar':9B 'como':6B 'nuevo':7B 'آیفون':2A 'با':8B 'جدید':1A 'مکس':5A 'پرو':4A
21d7e67a-822d-422e-86fb-c6307001c0ca	9b036601-ffa4-40d6-b8ce-b23663f4282d	es	Nuevo MacBook Pro M3	64 Go RAM, 2 To SSD, negro lateral	auto	2026-05-10 01:22:57.685549-04	2026-05-10 01:22:57.685549-04	'2':8B '64':5B 'go':6B 'later':12B 'm3':4A 'macbook':2A 'negro':11B 'nuevo':1A 'pro':3A 'ram':7B 'ssd':10B
0250d0d5-54fe-4cc8-bf53-7deb7abbd378	07f04923-8e6e-42ad-8f73-05faf24d3bcf	de	Mehr über das Samsung Galaxy S24	Es dauerte bis zu 12 Stunden	auto	2026-05-10 01:22:57.80868-04	2026-05-10 01:22:57.80868-04	'12':11B 'bis':9B 'das':3A 'dauert':8B 'es':7B 'galaxi':5A 'mehr':1A 's24':6A 'samsung':4A 'stunden':12B 'zu':10B 'über':2A
25c6a2eb-42f1-461f-8927-f378a53f10af	4456157c-9ed0-4afd-8ffe-08dde788e6a0	de	Vintage-Plattenspieler – Technics SL-1200	Vollständig restauriert, neuer Tonabnehmer, klingt fantastisch	auto	2026-05-10 01:22:57.811975-04	2026-05-10 01:22:57.811975-04	'-1200':6A 'fantastisch':12B 'klingt':11B 'neuer':9B 'plattenspiel':3A 'restauriert':8B 'sl':5A 'technic':4A 'tonabnehm':10B 'vintag':2A 'vintage-plattenspiel':1A 'vollständig':7B
7176b8da-01d8-400d-83ac-cf31f5593f4b	9878222b-8d19-47d2-90ed-fcdc31ce9d48	de	Mehr PS5-Version	Neues Produkt, ungeöffnet, 2 Stück CONTRON	auto	2026-05-10 01:22:57.815485-04	2026-05-10 01:22:57.815485-04	'2':8B 'contron':10B 'mehr':1A 'neue':5B 'produkt':6B 'ps5':3A 'ps5-version':2A 'stück':9B 'ungeöffnet':7B 'version':4A
32e5aa9d-9029-4a76-80e1-8fc3b77bacb0	9878222b-8d19-47d2-90ed-fcdc31ce9d48	en	新しいPS5 デジタルエディション	New product, unopened, 2 pcs of CONTRON	auto	2026-05-10 01:22:57.944743-04	2026-05-10 01:22:57.944743-04	'2':6B 'contron':9B 'new':3B 'pcs':7B 'product':4B 'unopen':5B 'デジタルエディション':2A '新しいps5':1A
8656743b-d83f-4f72-b5c2-968713de4021	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	es	Bolso mensajero de cuero hecho a mano	Cuero de plena flor, herrajes de latón, cosidos a mano.	auto	2026-05-10 01:22:57.993182-04	2026-05-10 01:22:57.993182-04	'bolso':1A 'cosido':15B 'cuero':4A,8B 'de':3A,9B,13B 'flor':11B 'hecho':5A 'herraj':12B 'latón':14B 'mano':7A,17B 'mensajero':2A 'plena':10B
b4ca6006-3c88-4544-a3b4-3303bfc5c69d	4456157c-9ed0-4afd-8ffe-08dde788e6a0	es	Tocadiscos antiguo - Technics SL-1200	Totalmente restaurado, cartucho nuevo, suena increíble.	auto	2026-05-10 01:22:58.532275-04	2026-05-10 01:22:58.532275-04	'-1200':5A 'antiguo':2A 'cartucho':8B 'increíbl':11B 'nuevo':9B 'restaurado':7B 'sl':4A 'suena':10B 'technic':3A 'tocadisco':1A 'totalment':6B
ece7d116-c5c3-4e30-89bc-f1438d569b93	07f04923-8e6e-42ad-8f73-05faf24d3bcf	es	Modelo Samsung Galaxy S24	Còn nguyên hộp, bảo hành 12 tháng	auto	2026-05-10 01:22:58.540778-04	2026-05-10 01:22:58.540778-04	'12':10B 'bảo':8B 'còn':5B 'galaxi':3A 'hành':9B 'hộp':7B 'modelo':1A 'nguyên':6B 's24':4A 'samsung':2A 'tháng':11B
9481e15a-d7e7-485d-83d3-ac3d2eac0e59	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	fr	Nouvel iPhone 15 Pro Mix	Retournez-vous, avec votre carquois original et votre pomme	auto	2026-05-10 01:22:58.750597-04	2026-05-10 01:22:58.750597-04	'15':3A 'avec':9B 'carquoi':11B 'et':13B 'iphon':2A 'mix':5A 'nouvel':1A 'origin':12B 'pomm':15B 'pro':4A 'retournez':7B 'retournez-v':6B 'votr':10B,14B 'vous':8B
1cbeb956-5709-4120-b3d5-8f7ee6204f94	9b036601-ffa4-40d6-b8ce-b23663f4282d	fa	مک بوک پرو M3 نو	64 رفتن به رم، 2 به SSD، noir sideral	auto	2026-05-10 01:22:58.814599-04	2026-05-10 01:22:58.814599-04	'2':10B '64':6B 'm3':4A 'noir':13B 'sider':14B 'ssd':12B 'به':8B,11B 'بوک':2A 'رفتن':7B 'رم':9B 'مک':1A 'نو':5A 'پرو':3A
d240bf31-6b98-4a12-bd18-015d5813d741	9878222b-8d19-47d2-90ed-fcdc31ce9d48	es	Juegos de PS5	Producto nuevo, sin abrir, 2 unidades de CONTRON	auto	2026-05-10 01:22:58.921134-04	2026-05-10 01:22:58.921134-04	'2':8B 'abrir':7B 'contron':11B 'de':2A,10B 'juego':1A 'nuevo':5B 'producto':4B 'ps5':3A 'sin':6B 'unidad':9B
7cf24abc-3eb5-47a1-9c2c-98eb1f6c9073	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	fa	کیف مسنجر چرم دست ساز	چرم دانه کامل، سخت افزار برنجی، دوخت دستی	auto	2026-05-10 01:22:59.236416-04	2026-05-10 01:22:59.236416-04	'افزار':10B 'برنجی':11B 'دانه':7B 'دست':4A 'دستی':13B 'دوخت':12B 'ساز':5A 'سخت':9B 'مسنجر':2A 'چرم':3A,6B 'کامل':8B 'کیف':1A
634147ff-312b-48a6-9be8-d40011606f20	3e170287-9b34-42fc-a3f6-cbc29aff1db6	fr	Un nouvel iPhone 15 Pro Max	Comme nouveau, avec boîte originale et AppleCare+	auto	2026-05-10 01:22:59.367144-04	2026-05-10 01:22:59.367144-04	'15':4A 'applecar':13B 'avec':9B 'boît':10B 'comm':7B 'et':12B 'iphon':3A 'max':6A 'nouveau':8B 'nouvel':2A 'original':11B 'pro':5A 'un':1A
d9e81723-1e43-4ba0-a9c8-55abdd6cd02b	07f04923-8e6e-42ad-8f73-05faf24d3bcf	fa	سامسونگ گلکسی اس 24 را می شناسم	Còn nguyên hộp, bảo hành 12 tháng	auto	2026-05-10 01:22:59.742846-04	2026-05-10 01:22:59.742846-04	'12':13B '24':4A 'bảo':11B 'còn':8B 'hành':12B 'hộp':10B 'nguyên':9B 'tháng':14B 'اس':3A 'را':5A 'سامسونگ':1A 'شناسم':7A 'می':6A 'گلکسی':2A
af2efadd-ef51-450d-acde-4342f2895618	9878222b-8d19-47d2-90ed-fcdc31ce9d48	fa	新しいPS5 デジタルエディション	محصول جدید باز نشده 2 عدد CONTRON	auto	2026-05-10 01:23:00.82368-04	2026-05-10 01:23:00.82368-04	'2':7B 'contron':9B 'باز':5B 'جدید':4B 'عدد':8B 'محصول':3B 'نشده':6B 'デジタルエディション':2A '新しいps5':1A
549b17bf-23ec-479a-9504-a04a12fa747a	07f04923-8e6e-42ad-8f73-05faf24d3bcf	fr	Voici mon Samsung Galaxy S24	Còn nguyên hộp, bảo hành 12tháng	auto	2026-05-10 01:23:01.111946-04	2026-05-10 01:23:01.111946-04	'12tháng':11B 'bảo':9B 'còn':6B 'galaxi':4A 'hành':10B 'hộp':8B 'mon':2A 'nguyên':7B 's24':5A 'samsung':3A 'voici':1A
5e7882a5-91eb-4248-881f-cd4708d114b1	9b036601-ffa4-40d6-b8ce-b23663f4282d	hi	नोव्यू मैकबुक प्रो एम3	64 गो रैम, 2 टू एसएसडी, नॉयर साइडरल	auto	2026-05-10 01:23:01.341544-04	2026-05-10 01:23:01.341544-04	'2':8B '64':5B 'एम3':4A 'एसएसडी':10B 'गो':6B 'टू':9B 'नॉयर':11B 'नोव्यू':1A 'प्रो':3A 'मैकबुक':2A 'रैम':7B 'साइडरल':12B
a89ca325-97d7-4490-b406-e54ead5d5393	07f04923-8e6e-42ad-8f73-05faf24d3bcf	hi	यह सैमसंग गैलेक्सी S24 है	एक बार फिर, 12 दिन पहले	auto	2026-05-10 01:23:02.229471-04	2026-05-10 01:23:02.229471-04	'12':9B 's24':4A 'एक':6B 'गैलेक्सी':3A 'दिन':10B 'पहले':11B 'फिर':8B 'बार':7B 'यह':1A 'सैमसंग':2A 'है':5A
cd1c8926-e0a6-4656-a814-3a5b217d21ad	3e170287-9b34-42fc-a3f6-cbc29aff1db6	ja	新しいiPhone 15 Pro Max	オリジナルと AppleCare+ の新しい通信	auto	2026-05-10 01:23:03.384565-04	2026-05-10 01:23:03.384565-04	'15':2A 'applecar':6B 'max':4A 'pro':3A 'の新しい通信':7B 'オリジナルと':5B '新しいiphon':1A
32f802a8-8517-4d26-a80c-4f8f778287f6	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	ja	ハンドメイドレザーメッセンジャーバッグ	フルグレインレザー、真鍮金具、手縫い	auto	2026-05-10 01:23:04.487774-04	2026-05-10 01:23:04.487774-04	'ハンドメイドレザーメッセンジャーバッグ':1A 'フルグレインレザー':2B '手縫い':4B '真鍮金具':3B
537b6a62-a8f1-4412-8c2e-c2642b41d2e0	07f04923-8e6e-42ad-8f73-05faf24d3bcf	ja	Samsung Galaxy S24 を見てみましょう	Còn nguyên hộp、bảo hành 12 tháng	auto	2026-05-10 01:23:04.600036-04	2026-05-10 01:23:04.600036-04	'12':10B 'bảo':8B 'còn':5B 'galaxi':2A 'hành':9B 'hộp':7B 'nguyên':6B 's24':3A 'samsung':1A 'tháng':11B 'を見てみましょう':4A
47876d0b-ac1b-4229-b63a-7f1ef7d2563f	9b036601-ffa4-40d6-b8ce-b23663f4282d	pt	Novo MacBook Pro M3	64 GB de RAM, 2 para SSD, preto sideral	auto	2026-05-10 01:23:05.369578-04	2026-05-10 01:23:05.369578-04	'2':9B '64':5B 'de':7B 'gb':6B 'm3':4A 'macbook':2A 'novo':1A 'para':10B 'preto':12B 'pro':3A 'ram':8B 'sider':13B 'ssd':11B
6b77e236-528b-4b43-82c4-6e285ac70f50	3e170287-9b34-42fc-a3f6-cbc29aff1db6	ko	새로운 iPhone 15 Pro Max	새로운 제품, 원래 AppleCare+ 구매 가능	auto	2026-05-10 01:23:05.80882-04	2026-05-10 01:23:05.80882-04	'15':3A 'applecar':9B 'iphon':2A 'max':5A 'pro':4A '가능':11B '구매':10B '새로운':1A,6B '원래':8B '제품':7B
cbadbb84-e558-42a9-b3cd-cba23c6f0f4a	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	pt	Novo mix do iPhone 15 Pro	Vire-se, com sua aljava original e sua maçã	auto	2026-05-10 01:23:06.076273-04	2026-05-10 01:23:06.076273-04	'15':5A 'aljava':12B 'com':10B 'e':14B 'iphon':4A 'maçã':16B 'mix':2A 'novo':1A 'origin':13B 'pro':6A 'se':9B 'sua':11B,15B 'vire':8B 'vire-s':7B
36190156-4ae9-4bda-9547-e2f1fad1280f	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	ko	수제 가죽 메신저백	풀 그레인 가죽, 황동 하드웨어, 핸드 스티치	auto	2026-05-10 01:23:06.900659-04	2026-05-10 01:23:06.900659-04	'가죽':2A,6B '그레인':5B '메신저백':3A '수제':1A '스티치':10B '풀':4B '하드웨어':8B '핸드':9B '황동':7B
6bdacced-1a71-451f-912d-411f7cb6d937	07f04923-8e6e-42ad-8f73-05faf24d3bcf	ko	Samsung Galaxy S24에 대해 알아보기	Còn nguyên hộp, bảo hành 12 tháng	auto	2026-05-10 01:23:07.154704-04	2026-05-10 01:23:07.154704-04	'12':11B 'bảo':9B 'còn':6B 'galaxi':2A 'hành':10B 'hộp':8B 'nguyên':7B 's24에':3A 'samsung':1A 'tháng':12B '대해':4A '알아보기':5A
bd90f564-d10d-4d5f-b76e-1276e1a050a6	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	ru	Новый iPhone 15 Pro Микс	Повернись со своим оригинальным колчаном и яблоком.	auto	2026-05-10 01:23:07.331119-04	2026-05-10 01:23:07.331119-04	'15':3A 'iphon':2A 'pro':4A 'и':11B 'колчаном':10B 'микс':5A 'новый':1A 'оригинальным':9B 'повернись':6B 'своим':8B 'со':7B 'яблоком':12B
9152ea75-4b53-4ad5-8faf-6f2d5a4f53a3	9b036601-ffa4-40d6-b8ce-b23663f4282d	ru	Новый Макбук Про М3	64 ГБ ОЗУ, 2 SSD, черный вид	auto	2026-05-10 01:23:07.37172-04	2026-05-10 01:23:07.37172-04	'2':8B '64':5B 'ssd':9B 'вид':11B 'гб':6B 'м3':4A 'макбук':2A 'новый':1A 'озу':7B 'про':3A 'черный':10B
e9855f6d-8d22-406b-8aaa-2a6a8345c66d	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	pt	Bolsa mensageiro de couro artesanal	Couro de flor integral, detalhes em latão, costurado à mão	auto	2026-05-10 01:23:07.580335-04	2026-05-10 01:23:07.580335-04	'artesan':5A 'bolsa':1A 'costurado':13B 'couro':4A,6B 'de':3A,7B 'detalh':10B 'em':11B 'flor':8B 'integr':9B 'latão':12B 'mensageiro':2A 'mão':15B 'à':14B
04f42875-3e8a-42e7-984f-c633c2239aff	07f04923-8e6e-42ad-8f73-05faf24d3bcf	pt	Como comprar um Samsung Galaxy S24	Còn nguyên hộp, bảo hành 12 tháng	auto	2026-05-10 01:23:07.967738-04	2026-05-10 01:23:07.967738-04	'12':12B 'bảo':10B 'como':1A 'comprar':2A 'còn':7B 'galaxi':5A 'hành':11B 'hộp':9B 'nguyên':8B 's24':6A 'samsung':4A 'tháng':13B 'um':3A
21ef87e6-5488-433b-9034-d7d0c953ed4f	07f04923-8e6e-42ad-8f73-05faf24d3bcf	ru	Еще раз о Samsung Galaxy S24	Con nguyên hộp, bảo hành 12 tháng	auto	2026-05-10 01:23:09.401041-04	2026-05-10 01:23:09.401041-04	'12':12B 'bảo':10B 'con':7B 'galaxi':5A 'hành':11B 'hộp':9B 'nguyên':8B 's24':6A 'samsung':4A 'tháng':13B 'еще':1A 'о':3A 'раз':2A
e11b2658-8420-4c6f-926d-d53c8b3a9ee6	9b036601-ffa4-40d6-b8ce-b23663f4282d	tl	Bagong MacBook Pro M3	64 Go RAM, 2 To SSD, noir sidéral	auto	2026-05-10 01:23:09.446216-04	2026-05-10 01:23:09.446216-04	'2':8B '64':5B 'bagong':1A 'go':6B 'm3':4A 'macbook':2A 'noir':11B 'pro':3A 'ram':7B 'sidéral':12B 'ssd':10B
de828a18-8355-41f0-bfda-8933d5981ff5	4456157c-9ed0-4afd-8ffe-08dde788e6a0	fa	پخش کننده رکورد قدیمی - Technics SL-1200	کاملاً بازسازی شده، کارتریج جدید، صدای شگفت انگیزی دارد	auto	2026-05-10 01:22:59.747388-04	2026-05-10 01:22:59.747388-04	'-1200':7A 'sl':6A 'technic':5A 'انگیزی':15B 'بازسازی':9B 'جدید':12B 'دارد':16B 'رکورد':3A 'شده':10B 'شگفت':14B 'صدای':13B 'قدیمی':4A 'پخش':1A 'کارتریج':11B 'کاملاً':8B 'کننده':2A
62dbeff3-906b-4d44-bc9b-2babfd8b840b	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	hi	नया आईफोन 15 प्रो मिक्स	अपने मूल तरकश और अपने सेब के साथ घूमें	auto	2026-05-10 01:23:00.802432-04	2026-05-10 01:23:00.802432-04	'15':3A 'अपने':6B,10B 'आईफोन':2A 'और':9B 'के':12B 'घूमें':14B 'तरकश':8B 'नया':1A 'प्रो':4A 'मिक्स':5A 'मूल':7B 'साथ':13B 'सेब':11B
9fe27636-93d6-433a-93b7-2cbe00b74f77	4456157c-9ed0-4afd-8ffe-08dde788e6a0	fr	Tourne-disque vintage - Technics SL-1200	Cartouche entièrement restaurée, neuve, sonne à merveille	auto	2026-05-10 01:23:01.114936-04	2026-05-10 01:23:01.114936-04	'-1200':7A 'cartouch':8B 'disqu':3A 'entièr':9B 'merveill':14B 'neuv':11B 'restauré':10B 'sl':6A 'sonn':12B 'technic':5A 'tourn':2A 'tourne-disqu':1A 'vintag':4A 'à':13B
b290be8a-860d-4996-8533-daf6ae8a345b	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	fr	Sac messager en cuir fait main	Cuir pleine fleur, garnitures en laiton, cousu main	auto	2026-05-10 01:23:01.148179-04	2026-05-10 01:23:01.148179-04	'cousu':13B 'cuir':4A,7B 'en':3A,11B 'fait':5A 'fleur':9B 'garnitur':10B 'laiton':12B 'main':6A,14B 'messag':2A 'plein':8B 'sac':1A
1084c0fc-0e2a-4b02-8001-566cdcec3ff3	3e170287-9b34-42fc-a3f6-cbc29aff1db6	hi	एक नया आईफोन 15 प्रो मैक्स	कोमो न्यूवो, कॉन काजा ओरिजिनल और AppleCare+	auto	2026-05-10 01:23:01.33847-04	2026-05-10 01:23:01.33847-04	'15':4A 'applecar':13B 'आईफोन':3A 'एक':1A 'ओरिजिनल':11B 'और':12B 'काजा':10B 'कॉन':9B 'कोमो':7B 'नया':2A 'न्यूवो':8B 'प्रो':5A 'मैक्स':6A
d15f3949-cab4-4e14-8735-4fe8403d2e4a	4456157c-9ed0-4afd-8ffe-08dde788e6a0	hi	विंटेज रिकॉर्ड प्लेयर - टेक्निक्स एसएल-1200	पूरी तरह से बहाल, नया कारतूस, अद्भुत लगता है	auto	2026-05-10 01:23:02.238649-04	2026-05-10 01:23:02.238649-04	'-1200':6A 'अद्भुत':13B 'एसएल':5A 'कारतूस':12B 'टेक्निक्स':4A 'तरह':8B 'नया':11B 'पूरी':7B 'प्लेयर':3A 'बहाल':10B 'रिकॉर्ड':2A 'लगता':14B 'विंटेज':1A 'से':9B 'है':15B
1802de24-8e08-41c7-91f0-6a3e62aab2f2	9b036601-ffa4-40d6-b8ce-b23663f4282d	ja	ヌーボーMacBook Pro M3	64 Go RAM、2 To SSD、ノワール シデラル	auto	2026-05-10 01:23:02.331935-04	2026-05-10 01:23:02.331935-04	'2':7B '64':4B 'go':5B 'm3':3A 'pro':2A 'ram':6B 'ssd':9B 'シデラル':11B 'ヌーボーmacbook':1A 'ノワール':10B
88c59051-ac58-4a01-b825-d1d29dccbb14	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	hi	हस्तनिर्मित चमड़ा मैसेंजर बैग	पूर्ण अनाज चमड़ा, पीतल हार्डवेयर, हाथ से सिला हुआ	auto	2026-05-10 01:23:02.559009-04	2026-05-10 01:23:02.559009-04	'अनाज':6B 'चमड़ा':2A,7B 'पीतल':8B 'पूर्ण':5B 'बैग':4A 'मैसेंजर':3A 'सिला':12B 'से':11B 'हस्तनिर्मित':1A 'हाथ':10B 'हार्डवेयर':9B 'हुआ':13B
82713411-234f-4e40-9322-02a1e061ec77	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	ja	新しいiPhone 15 Proミックス	振り向いて、オリジナルの矢筒とリンゴを持って	auto	2026-05-10 01:23:02.887417-04	2026-05-10 01:23:02.887417-04	'15':2A 'proミックス':3A 'オリジナルの矢筒とリンゴを持って':5B '振り向いて':4B '新しいiphon':1A
db36510c-9fa5-4389-8ba5-e35b3053d564	9878222b-8d19-47d2-90ed-fcdc31ce9d48	fr	Jeux PS5 pour PS5	Produit neuf, non ouvert, 2 pcs de CONTRON	auto	2026-05-10 01:23:03.382055-04	2026-05-10 01:23:03.382055-04	'2':9B 'contron':12B 'de':11B 'jeux':1A 'neuf':6B 'non':7B 'ouvert':8B 'pcs':10B 'pour':3A 'produit':5B 'ps5':2A,4A
4ba295a3-c8a3-49ac-94db-74e7d514f844	9b036601-ffa4-40d6-b8ce-b23663f4282d	ko	누보 맥북 프로 M3	64 Go RAM, 2 SSD로, 느와르 사이드	auto	2026-05-10 01:23:04.495639-04	2026-05-10 01:23:04.495639-04	'2':8B '64':5B 'go':6B 'm3':4A 'ram':7B 'ssd로':9B '누보':1A '느와르':10B '맥북':2A '사이드':11B '프로':3A
3f2a649a-100d-4d5e-81a6-59f5e99d809c	4456157c-9ed0-4afd-8ffe-08dde788e6a0	ja	ビンテージ レコード プレーヤー - Technics SL-1200	完全に復元された新しいカートリッジ、素晴らしいサウンドです	auto	2026-05-10 01:23:04.592949-04	2026-05-10 01:23:04.592949-04	'-1200':6A 'sl':5A 'technic':4A 'ビンテージ':1A 'プレーヤー':3A 'レコード':2A '完全に復元された新しいカートリッジ':7B '素晴らしいサウンドです':8B
49ee6a36-60b3-4751-89fc-858c70de0798	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	ko	새로운 iPhone 15 Pro 믹스	돌아서서 원래의 화살통과 사과를 들고	auto	2026-05-10 01:23:04.607503-04	2026-05-10 01:23:04.607503-04	'15':3A 'iphon':2A 'pro':4A '돌아서서':6B '들고':10B '믹스':5A '사과를':9B '새로운':1A '원래의':7B '화살통과':8B
251e43c1-a603-46a2-8499-962de3f9c173	9878222b-8d19-47d2-90ed-fcdc31ce9d48	hi	PS5 डाउनलोड करें	नया उत्पाद, खुला नहीं, 2 पीसी नियंत्रण	auto	2026-05-10 01:23:05.324373-04	2026-05-10 01:23:05.324373-04	'2':8B 'ps5':1A 'उत्पाद':5B 'करें':3A 'खुला':6B 'डाउनलोड':2A 'नया':4B 'नहीं':7B 'नियंत्रण':10B 'पीसी':9B
edcab89e-846a-4e02-acc9-caf351a0e8f2	9878222b-8d19-47d2-90ed-fcdc31ce9d48	ja	新しいPS5デジタル版	新品未開封、コントロン2個	auto	2026-05-10 01:23:06.951583-04	2026-05-10 01:23:06.951583-04	'コントロン2個':3B '新しいps5デジタル版':1A '新品未開封':2B
f30f3686-ada8-41f4-9f74-f5f7d00f6ab1	3e170287-9b34-42fc-a3f6-cbc29aff1db6	pt	Um novo iPhone 15 Pro Max	Como novo, com caixa original e AppleCare+	auto	2026-05-10 01:23:07.132101-04	2026-05-10 01:23:07.132101-04	'15':4A 'applecar':13B 'caixa':10B 'com':9B 'como':7B 'e':12B 'iphon':3A 'max':6A 'novo':2A,8B 'origin':11B 'pro':5A 'um':1A
e707adc7-9a00-4e18-b7cf-6d0da2db474a	4456157c-9ed0-4afd-8ffe-08dde788e6a0	ko	빈티지 레코드 플레이어 - 테크닉스 SL-1200	완전히 복원된 새 카트리지, 소리가 놀랍습니다.	auto	2026-05-10 01:23:07.146703-04	2026-05-10 01:23:07.146703-04	'-1200':6A 'sl':5A '놀랍습니다':12B '레코드':2A '복원된':8B '빈티지':1A '새':9B '소리가':11B '완전히':7B '카트리지':10B '테크닉스':4A '플레이어':3A
5c24ace3-4ff4-4839-92ee-bca4770e6d88	4456157c-9ed0-4afd-8ffe-08dde788e6a0	pt	Toca-discos vintage - Technics SL-1200	Totalmente restaurado, cartucho novo, parece incrível	auto	2026-05-10 01:23:07.97166-04	2026-05-10 01:23:07.97166-04	'-1200':7A 'cartucho':10B 'disco':3A 'incrível':13B 'novo':11B 'parec':12B 'restaurado':9B 'sl':6A 'technic':5A 'toca':2A 'toca-disco':1A 'totalment':8B 'vintag':4A
294fbcca-4b32-413a-bef8-ccdb19425ab4	3e170287-9b34-42fc-a3f6-cbc29aff1db6	ru	Новый iPhone 15 Pro Max	Как новое, с оригинальной кашей и AppleCare+	auto	2026-05-10 01:23:08.347708-04	2026-05-10 01:23:08.347708-04	'15':3A 'applecar':12B 'iphon':2A 'max':5A 'pro':4A 'и':11B 'как':6B 'кашей':10B 'новое':7B 'новый':1A 'оригинальной':9B 'с':8B
1101e4ea-b146-4d62-96aa-85736929818b	9878222b-8d19-47d2-90ed-fcdc31ce9d48	pt	新しいPS5 デジタルエディション	Produto novo, fechado, 2 peças de CONTRON	auto	2026-05-10 01:23:10.020023-04	2026-05-10 01:23:10.020023-04	'2':6B 'contron':9B 'de':8B 'fechado':5B 'novo':4B 'peça':7B 'produto':3B 'デジタルエディション':2A '新しいps5':1A
bedc1ddb-a0a2-4dec-b753-a3435e3c467f	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	ru	Кожаная сумка-мессенджер ручной работы	Натуральная кожа, латунная фурнитура, прошита вручную.	auto	2026-05-10 01:23:08.660037-04	2026-05-10 01:23:08.660037-04	'вручную':12B 'кожа':8B 'кожаная':1A 'латунная':9B 'мессенджер':4A 'натуральная':7B 'прошита':11B 'работы':6A 'ручной':5A 'сумка':3A 'сумка-мессенджер':2A 'фурнитура':10B
f9e4d516-d2fa-49aa-9878-2a87b48cd19a	9878222b-8d19-47d2-90ed-fcdc31ce9d48	ko	새로운 PS5 디지털 에디션	새 제품, 미개봉, CONTRON 2개	auto	2026-05-10 01:23:09.089738-04	2026-05-10 01:23:09.089738-04	'2개':9B 'contron':8B 'ps5':2A '디지털':3A '미개봉':7B '새':5B '새로운':1A '에디션':4A '제품':6B
b99de3be-f02f-4069-ba5f-8c532bde3f43	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	sv	Ny iPhone 15 Pro Mix	Vänd dig om, med ditt ursprungliga koger och ditt äpple	auto	2026-05-10 01:23:09.266097-04	2026-05-10 01:23:09.266097-04	'15':3A 'dig':7B 'ditt':10B,14B 'iphon':2A 'koger':12B 'med':9B 'mix':5A 'ny':1A 'och':13B 'om':8B 'pro':4A 'ursprungliga':11B 'vänd':6B 'äpple':15B
a28599a4-36a5-4218-824a-3e57be7957e2	4456157c-9ed0-4afd-8ffe-08dde788e6a0	ru	Винтажный проигрыватель пластинок - Technics SL-1200	Полностью восстановлен, новый картридж, звучит потрясающе.	auto	2026-05-10 01:23:09.399208-04	2026-05-10 01:23:09.399208-04	'-1200':6A 'sl':5A 'technic':4A 'винтажный':1A 'восстановлен':8B 'звучит':11B 'картридж':10B 'новый':9B 'пластинок':3A 'полностью':7B 'потрясающе':12B 'проигрыватель':2A
fd15aa32-cf17-4eda-ac52-27f187833522	9b036601-ffa4-40d6-b8ce-b23663f4282d	tr	Yeni MacBook Pro M3	64 Go RAM, 2 SSD'ye, noir sideral	auto	2026-05-10 01:23:11.175448-04	2026-05-10 01:23:11.175448-04	'2':8B '64':5B 'go':6B 'm3':4A 'macbook':2A 'noir':11B 'pro':3A 'ram':7B 'sider':12B 'ssd':9B 'ye':10B 'yeni':1A
27537d90-8365-47fd-a658-0fa082e79bf3	07f04923-8e6e-42ad-8f73-05faf24d3bcf	sv	Tillsammans med Samsung Galaxy S24 mới	Còn nguyên hộp, bảo hành 12 tháng	auto	2026-05-10 01:23:11.884894-04	2026-05-10 01:23:11.884894-04	'12':12B 'bảo':10B 'còn':7B 'galaxi':4A 'hành':11B 'hộp':9B 'med':2A 'mới':6A 'nguyên':8B 's24':5A 'samsung':3A 'tháng':13B 'tillsamman':1A
f335a673-3c9f-4231-89fa-fc3d06c1e3b9	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	tr	Yeni iPhone 15 Pro Karışımı	Orijinal ok kılıfınız ve elmanızla arkanızı dönün	auto	2026-05-10 01:23:12.395258-04	2026-05-10 01:23:12.395258-04	'15':3A 'arkanızı':11B 'dönün':12B 'elmanızla':10B 'iphon':2A 'karışımı':5A 'kılıfınız':8B 'ok':7B 'orijin':6B 'pro':4A 've':9B 'yeni':1A
81372dab-7dc1-4e40-af6e-048e8a39fe46	3e170287-9b34-42fc-a3f6-cbc29aff1db6	tr	Yeni bir iPhone 15 Pro Max	Yeni olarak, orijinal ve AppleCare+ ile birlikte	auto	2026-05-10 01:23:12.623296-04	2026-05-10 01:23:12.623296-04	'15':4A 'applecar':11B 'bir':2A 'birlikt':13B 'ile':12B 'iphon':3A 'max':6A 'olarak':8B 'orijin':9B 'pro':5A 've':10B 'yeni':1A,7B
5cc9bee0-029f-4700-8444-993073a4d8c0	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	ur	ہاتھ سے تیار چمڑے کا میسنجر بیگ	مکمل اناج کا چمڑا، پیتل کا ہارڈ ویئر، ہاتھ سے سلایا ہوا ہے۔	auto	2026-05-10 01:23:12.899498-04	2026-05-10 01:23:12.899498-04	'اناج':9B 'بیگ':7A 'تیار':3A 'سلایا':18B 'سے':2A,17B 'مکمل':8B 'میسنجر':6A 'ویئر':15B 'پیتل':12B 'چمڑا':11B 'چمڑے':4A 'کا':5A,10B,13B 'ہاتھ':1A,16B 'ہارڈ':14B 'ہوا':19B 'ہے':20B
92bb00fc-a2cf-4323-9ac2-46012845ce09	9878222b-8d19-47d2-90ed-fcdc31ce9d48	sv	新しいPS5 デジタルエディション	Ny produkt, oöppnad, 2 st CONTRON	auto	2026-05-10 01:23:12.99515-04	2026-05-10 01:23:12.99515-04	'2':6B 'contron':8B 'ny':3B 'oöppnad':5B 'produkt':4B 'st':7B 'デジタルエディション':2A '新しいps5':1A
e2bb001b-cdf4-4d17-87d5-c347a696d9c5	3e170287-9b34-42fc-a3f6-cbc29aff1db6	ur	نیا آئی فون 15 پرو میکس	Como nuevo, con caja original y AppleCare+	auto	2026-05-10 01:23:13.417538-04	2026-05-10 01:23:13.417538-04	'15':4A 'applecar':13B 'caja':10B 'como':7B 'con':9B 'nuevo':8B 'origin':11B 'y':12B 'آئی':2A 'فون':3A 'میکس':6A 'نیا':1A 'پرو':5A
ef8f730c-ddb4-41d1-a119-bd6c25ec96b4	9b036601-ffa4-40d6-b8ce-b23663f4282d	vi	MacBook Pro M3 mới	64 Go RAM, 2 sang SSD, noir sideral	auto	2026-05-10 01:23:13.763264-04	2026-05-10 01:23:13.763264-04	'2':8B '64':5B 'go':6B 'm3':3A 'macbook':1A 'mới':4A 'noir':11B 'pro':2A 'ram':7B 'sang':9B 'sider':12B 'ssd':10B
5f722254-a34d-4f09-92e8-beb69373a14d	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	ur	نیا آئی فون 15 پرو مکس	اپنے اصلی ترکش اور اپنے سیب کے ساتھ مڑیں۔	auto	2026-05-10 01:23:14.126648-04	2026-05-10 01:23:14.126648-04	'15':4A 'آئی':2A 'اصلی':8B 'اور':10B 'اپنے':7B,11B 'ترکش':9B 'ساتھ':14B 'سیب':12B 'فون':3A 'مڑیں':15B 'مکس':6A 'نیا':1A 'پرو':5A 'کے':13B
6b2347c8-5481-4237-942c-40b95b3b74e4	07f04923-8e6e-42ad-8f73-05faf24d3bcf	tl	Sa pamamagitan ng Samsung Galaxy S24 mới	Còn nguyên hộp, bảo hành 12 tháng	auto	2026-05-10 01:23:14.23909-04	2026-05-10 01:23:14.23909-04	'12':13B 'bảo':11B 'còn':8B 'galaxi':5A 'hành':12B 'hộp':10B 'mới':7A 'ng':3A 'nguyên':9B 'pamamagitan':2A 's24':6A 'sa':1A 'samsung':4A 'tháng':14B
1fef7439-3bf6-47ea-9324-ea9ac07f1523	4456157c-9ed0-4afd-8ffe-08dde788e6a0	tr	Vintage Plak Çalar - Technics SL-1200	Tamamen yenilendi, yeni kartuş, kulağa harika geliyor	auto	2026-05-10 01:23:14.361075-04	2026-05-10 01:23:14.361075-04	'-1200':6A 'geliyor':13B 'harika':12B 'kartuş':10B 'kulağa':11B 'plak':2A 'sl':5A 'tamamen':7B 'technic':4A 'vintag':1A 'yeni':9B 'yenilendi':8B 'çalar':3A
756b0842-250d-4aac-96ab-f4c178828465	4456157c-9ed0-4afd-8ffe-08dde788e6a0	ur	ونٹیج ریکارڈ پلیئر - ٹیکنکس SL-1200	مکمل طور پر بحال، نیا کارتوس، حیرت انگیز لگتا ہے۔	auto	2026-05-10 01:23:14.887461-04	2026-05-10 01:23:14.887461-04	'-1200':6A 'sl':5A 'انگیز':14B 'بحال':10B 'حیرت':13B 'ریکارڈ':2A 'طور':8B 'لگتا':15B 'مکمل':7B 'نیا':11B 'ونٹیج':1A 'ٹیکنکس':4A 'پر':9B 'پلیئر':3A 'کارتوس':12B 'ہے':16B
c611e11c-8d28-4e73-9b91-e2c7f1eeacb1	07f04923-8e6e-42ad-8f73-05faf24d3bcf	tr	Samsung Galaxy S24 Cihazını Kullanma	Bir gün sonra 12'den sonra	auto	2026-05-10 01:23:15.556106-04	2026-05-10 01:23:15.556106-04	'12':9B 'bir':6B 'cihazını':4A 'den':10B 'galaxi':2A 'gün':7B 'kullanma':5A 's24':3A 'samsung':1A 'sonra':8B,11B
a86e7f3a-f6fb-4cba-9672-3ac7cf1b9e08	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	vi	Hỗn hợp iPhone 15 Pro mới	Hãy quay lại, với chiếc bao tên ban đầu và quả táo của bạn	auto	2026-05-10 01:23:15.966563-04	2026-05-10 01:23:15.966563-04	'15':4A 'ban':14B 'bao':12B 'bạn':20B 'chiếc':11B 'của':19B 'hãi':7B 'hỗn':1A 'hợp':2A 'iphon':3A 'lại':9B 'mới':6A 'pro':5A 'quay':8B 'quả':17B 'táo':18B 'tên':13B 'và':16B 'với':10B 'đầu':15B
b8107d91-80e6-4909-9868-c33139193e1b	3e170287-9b34-42fc-a3f6-cbc29aff1db6	vi	iPhone 15 Pro Max mới	Như mới, với bản gốc và AppleCare+	auto	2026-05-10 01:23:16.093646-04	2026-05-10 01:23:16.093646-04	'15':2A 'applecar':12B 'bản':9B 'gốc':10B 'iphon':1A 'max':4A 'mới':5A,7B 'như':6B 'pro':3A 'và':11B 'với':8B
e69009c8-7053-4097-a705-7da217357cfb	07f04923-8e6e-42ad-8f73-05faf24d3bcf	ur	Samsung Galaxy S24 Mới کے لئے دستیاب ہے۔	Còn nguyên hộp, bảo hành 12 tháng	auto	2026-05-10 01:23:16.491797-04	2026-05-10 01:23:16.491797-04	'12':14B 'bảo':12B 'còn':9B 'galaxi':2A 'hành':13B 'hộp':11B 'mới':4A 'nguyên':10B 's24':3A 'samsung':1A 'tháng':15B 'دستیاب':7A 'لئے':6A 'کے':5A 'ہے':8A
816c57c8-2841-4176-b99a-60c58ab7a0b1	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	zh	手工皮革斜挎包	全粒面皮革，黄铜配件，手工缝制	auto	2026-05-10 01:23:16.957835-04	2026-05-10 01:23:16.957835-04	'全粒面皮革':2B '手工皮革斜挎包':1A '手工缝制':4B '黄铜配件':3B
28397ea8-e61b-4f1d-955c-15816217208f	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	sv	Handgjord messengerväska i läder	Fullnarvsläder, mässingsbeslag, handsytt	auto	2026-05-10 01:23:10.158516-04	2026-05-10 01:23:10.158516-04	'fullnarvsläd':5B 'handgjord':1A 'handsytt':7B 'läder':4A 'messengerväska':2A 'mässingsbeslag':6B
d2face5d-5eac-4903-b881-031970a82499	3e170287-9b34-42fc-a3f6-cbc29aff1db6	sv	En ny iPhone 15 Pro Max	Como ny, med original och AppleCare+	auto	2026-05-10 01:23:10.550485-04	2026-05-10 01:23:10.550485-04	'15':4A 'applecar':12B 'como':7B 'en':1A 'iphon':3A 'max':6A 'med':9B 'ny':2A,8B 'och':11B 'origin':10B 'pro':5A
d53cd79c-7328-4694-a4e0-d9a205de25ea	9878222b-8d19-47d2-90ed-fcdc31ce9d48	ru	新しいPS5 デジタルエディション	Новый продукт, нераспечатанный, CONTRON 2 шт.	auto	2026-05-10 01:23:11.131505-04	2026-05-10 01:23:11.131505-04	'2':7B 'contron':6B 'нераспечатанный':5B 'новый':3B 'продукт':4B 'шт':8B 'デジタルエディション':2A '新しいps5':1A
e5fe9af6-feb6-4eeb-9e6d-297f85e46e40	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	tl	Bagong iPhone 15 Pro Mix	Lumiko, kasama ang iyong orihinal na quiver at ang iyong mansanas	auto	2026-05-10 01:23:11.298445-04	2026-05-10 01:23:11.298445-04	'15':3A 'ang':8B,14B 'bagong':1A 'iphon':2A 'iyong':9B,15B 'kasama':7B 'lumiko':6B 'mansana':16B 'mix':5A 'na':11B 'orihin':10B 'pro':4A 'quiver':12B
99ef5951-a0b1-4e2e-a45b-34fe86effa54	4456157c-9ed0-4afd-8ffe-08dde788e6a0	sv	Vintage skivspelare - Technics SL-1200	Helt återställd, ny patron, låter fantastiskt	auto	2026-05-10 01:23:11.88665-04	2026-05-10 01:23:11.88665-04	'-1200':5A 'fantastiskt':11B 'helt':6B 'låter':10B 'ny':8B 'patron':9B 'skivspelar':2A 'sl':4A 'technic':3A 'vintag':1A 'återställd':7B
5150cb45-50ae-4963-8e47-3e52ac9f86e7	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	tr	El Yapımı Deri Messenger Çanta	Sırçalı deri, pirinç donanım, el dikişi	auto	2026-05-10 01:23:12.392-04	2026-05-10 01:23:12.392-04	'deri':3A,7B 'dikişi':11B 'donanım':9B 'el':1A,10B 'messeng':4A 'pirinç':8B 'sırçalı':6B 'yapımı':2A 'çanta':5A
57ed5154-51ed-43a1-8951-ea33b82b3590	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	vi	Túi da làm bằng tay	Da nguyên miếng, phần cứng bằng đồng, khâu tay	auto	2026-05-10 01:23:14.906541-04	2026-05-10 01:23:14.906541-04	'bằng':4A,11B 'cứng':10B 'da':2A,6B 'khâu':13B 'làm':3A 'miếng':8B 'nguyên':7B 'phần':9B 'tay':5A,14B 'túi':1A 'đồng':12B
e3a4bacc-ef5c-4820-b95e-f69e40a56875	9b036601-ffa4-40d6-b8ce-b23663f4282d	zh	新风格 MacBook Pro M3	64 Go RAM，2 至 SSD，黑色侧边	auto	2026-05-10 01:23:15.05312-04	2026-05-10 01:23:15.05312-04	'2':8B '64':5B 'go':6B 'm3':4A 'macbook':2A 'pro':3A 'ram':7B 'ssd':10B '新风格':1A '至':9B '黑色侧边':11B
6b000cfd-c7cd-4926-9b82-6553373b2378	9878222b-8d19-47d2-90ed-fcdc31ce9d48	tl	新しいPS5 デジタルエディション	Bagong produkto, hindi pa nabubuksan, 2 pcs ng CONTRON	auto	2026-05-10 01:23:15.488312-04	2026-05-10 01:23:15.488312-04	'2':8B 'bagong':3B 'contron':11B 'hindi':5B 'nabubuksan':7B 'ng':10B 'pa':6B 'pcs':9B 'produkto':4B 'デジタルエディション':2A '新しいps5':1A
cb66cfbc-7d48-43fb-9d42-b95434ede61c	4456157c-9ed0-4afd-8ffe-08dde788e6a0	zh	老式电唱机 - Technics SL-1200	完全修复，新唱头，听起来棒极了	auto	2026-05-10 01:23:19.719369-04	2026-05-10 01:23:19.719369-04	'-1200':4A 'sl':3A 'technic':2A '听起来棒极了':7B '完全修复':5B '新唱头':6B '老式电唱机':1A
9b9c7b24-dd1b-4b42-9943-f6c7beb0a229	4456157c-9ed0-4afd-8ffe-08dde788e6a0	vi	Máy Ghi Âm Cổ Điển - Technics SL-1200	Đã khôi phục hoàn toàn, hộp mực mới, âm thanh tuyệt vời	auto	2026-05-10 01:23:17.321582-04	2026-05-10 01:23:17.321582-04	'-1200':8A 'cổ':4A 'ghi':2A 'hoàn':12B 'hộp':14B 'khôi':10B 'mái':1A 'mới':16B 'mực':15B 'phục':11B 'sl':7A 'technic':6A 'thanh':18B 'toàn':13B 'tuyệt':19B 'vời':20B 'âm':3A,17B 'điển':5A 'đã':9B
36aaf146-e571-4053-bfab-b966dc4ca2e2	9878222b-8d19-47d2-90ed-fcdc31ce9d48	tr	PS5'i etkinleştirin	Yeni ürün, açılmamış, 2 adet CONTRON	auto	2026-05-10 01:23:17.527226-04	2026-05-10 01:23:17.527226-04	'2':7B 'adet':8B 'açılmamış':6B 'contron':9B 'etkinleştirin':3A 'ps5':1A 'yeni':4B 'ürün':5B
915c87fd-786f-4298-95bd-d342de20d34e	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	zh	新款 iPhone 15 Pro 组合	转身，带着你原来的箭袋和你的苹果	auto	2026-05-10 01:23:17.729407-04	2026-05-10 01:23:17.729407-04	'15':3A 'iphon':2A 'pro':4A '带着你原来的箭袋和你的苹果':7B '新款':1A '组合':5A '转身':6B
43eb4a75-23fb-4509-acc1-5842f042a43c	9878222b-8d19-47d2-90ed-fcdc31ce9d48	ur	新しいPS5 デジタルエディション	نئی پروڈکٹ، نہ کھولی ہوئی، CONTRON کے 2 پی سیز	auto	2026-05-10 01:23:18.118975-04	2026-05-10 01:23:18.118975-04	'2':10B 'contron':8B 'سیز':12B 'نئی':3B 'نہ':5B 'پروڈکٹ':4B 'پی':11B 'کھولی':6B 'کے':9B 'ہوئی':7B 'デジタルエディション':2A '新しいps5':1A
6ba66394-aaad-4bfb-9136-6dd8d15272c3	3e170287-9b34-42fc-a3f6-cbc29aff1db6	zh	新款 iPhone 15 Pro Max	Como nuevo、con caja 原装和 AppleCare+	auto	2026-05-10 01:23:18.383719-04	2026-05-10 01:23:18.383719-04	'15':3A 'applecar':11B 'caja':9B 'como':6B 'con':8B 'iphon':2A 'max':5A 'nuevo':7B 'pro':4A '原装和':10B '新款':1A
05ecfe24-29d8-4a99-9013-2e295c045ba1	9878222b-8d19-47d2-90ed-fcdc31ce9d48	vi	PS5 của bạn	Sản phẩm mới, chưa mở, 2 chiếc CONTRON	auto	2026-05-10 01:23:19.705434-04	2026-05-10 01:23:19.705434-04	'2':9B 'bạn':3A 'chiếc':10B 'chưa':7B 'contron':11B 'của':2A 'mới':6B 'mở':8B 'phẩm':5B 'ps5':1A 'sản':4B
92d3dd31-c396-499d-9761-c16bf7bf9b47	07f04923-8e6e-42ad-8f73-05faf24d3bcf	zh	三星 Galaxy S24 手机	Còn nguyên hộp, bảo hành 12 tháng	auto	2026-05-10 01:23:19.740317-04	2026-05-10 01:23:19.740317-04	'12':10B 'bảo':8B 'còn':5B 'galaxi':2A 'hành':9B 'hộp':7B 'nguyên':6B 's24':3A 'tháng':11B '三星':1A '手机':4A
4a7b98b8-d51e-48c9-a8aa-faba12b20ed8	13dcabf9-a6a4-4636-9cfa-164ea320907d	ar	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:05.539561-04	2026-05-10 14:00:05.539561-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
952795a1-a564-4687-83be-2e1ebfafbd1b	13dcabf9-a6a4-4636-9cfa-164ea320907d	de	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:06.561356-04	2026-05-10 14:00:06.561356-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
3a25cbff-6666-4b0e-b3fc-3c2471329a0e	13dcabf9-a6a4-4636-9cfa-164ea320907d	es	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:07.072986-04	2026-05-10 14:00:07.072986-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
5fe265f6-b454-4142-965d-6878766636cf	13dcabf9-a6a4-4636-9cfa-164ea320907d	fa	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:07.588267-04	2026-05-10 14:00:07.588267-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
fd43d957-24f9-40d6-9ca0-2702cf06e3a6	13dcabf9-a6a4-4636-9cfa-164ea320907d	fr	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:08.09787-04	2026-05-10 14:00:08.09787-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
c40c0a6c-cd67-4809-b68b-f38b6d5ffd2e	13dcabf9-a6a4-4636-9cfa-164ea320907d	hi	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:08.606823-04	2026-05-10 14:00:08.606823-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
b4aeef17-665d-45e1-a0fd-d56266d57bff	13dcabf9-a6a4-4636-9cfa-164ea320907d	ja	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:09.019878-04	2026-05-10 14:00:09.019878-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
529a0fa2-f09e-47fc-9b9c-bd51c2b377db	13dcabf9-a6a4-4636-9cfa-164ea320907d	ko	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:09.426093-04	2026-05-10 14:00:09.426093-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
b7f280da-b473-4219-b1fa-38526dfc2c21	13dcabf9-a6a4-4636-9cfa-164ea320907d	pt	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:09.836362-04	2026-05-10 14:00:09.836362-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
dbefb852-2a74-45ba-b9e1-6e4103dfc563	13dcabf9-a6a4-4636-9cfa-164ea320907d	ru	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:10.23039-04	2026-05-10 14:00:10.23039-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
3381f85f-a5c0-4caa-8d30-e1b425b5c582	13dcabf9-a6a4-4636-9cfa-164ea320907d	sv	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:10.656655-04	2026-05-10 14:00:10.656655-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
d545b641-6afa-48cf-80bb-9237963cf676	13dcabf9-a6a4-4636-9cfa-164ea320907d	tl	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:11.063962-04	2026-05-10 14:00:11.063962-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
133dd2bb-dcf9-4d8f-a159-aeb8d5e91514	13dcabf9-a6a4-4636-9cfa-164ea320907d	tr	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:11.575401-04	2026-05-10 14:00:11.575401-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
d2b60c50-26bd-4a24-b1d1-b868f5b4cd53	13dcabf9-a6a4-4636-9cfa-164ea320907d	ur	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:12.088682-04	2026-05-10 14:00:12.088682-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
a7361540-0981-4eff-b9f9-d6f320359c70	13dcabf9-a6a4-4636-9cfa-164ea320907d	vi	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:12.498042-04	2026-05-10 14:00:12.498042-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
346f5d0b-0184-4828-a8bd-2e3c72418e0c	13dcabf9-a6a4-4636-9cfa-164ea320907d	zh	iPhone 15 Pro Max 256GB - Natural Titanium	Mint condition, original box, AppleCare+ until 2026	auto	2026-05-10 14:00:13.112688-04	2026-05-10 14:00:13.112688-04	'15':2A '2026':14B '256gb':5A 'applecar':12B 'box':11B 'condit':9B 'iphon':1A 'max':4A 'mint':8B 'natur':6A 'origin':10B 'pro':3A 'titanium':7A
f87238be-c297-49d9-91d4-952f1fed03fe	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	ar	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:13.72738-04	2026-05-10 14:00:13.72738-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
79f4a76b-a9ce-45f9-9fc8-57e1f44291b7	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	de	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:14.238324-04	2026-05-10 14:00:14.238324-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
97d06be3-eb89-4ccf-b50d-fb767a81711b	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	es	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:14.75097-04	2026-05-10 14:00:14.75097-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
493962d9-d0dc-4b18-bdf5-725f27c50afd	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	fa	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:15.160521-04	2026-05-10 14:00:15.160521-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
0a06c894-90a4-40fd-b44a-98e722d0f05e	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	fr	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:15.570013-04	2026-05-10 14:00:15.570013-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
1c1a9343-3473-42d4-88b8-ace16070fadf	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	hi	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:15.979317-04	2026-05-10 14:00:15.979317-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
3b1578fa-03c1-4a8e-92ff-06edf3e0123b	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	ja	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:16.594171-04	2026-05-10 14:00:16.594171-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
da6c0329-9fe2-4476-8e7d-1c6069227cd0	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	ko	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:17.003276-04	2026-05-10 14:00:17.003276-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
67658250-94c6-4c5e-8793-49fb4bd849f7	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	pt	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:17.347207-04	2026-05-10 14:00:17.347207-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
6efebc4e-87d6-4dc3-922b-0f90203360bc	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	ru	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:17.719277-04	2026-05-10 14:00:17.719277-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
faa40972-307b-4266-a768-d08df818e827	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	sv	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:18.129936-04	2026-05-10 14:00:18.129936-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
f90e1da3-bdc0-4228-98f1-a2f08260abb9	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	tl	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:18.539242-04	2026-05-10 14:00:18.539242-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
a168c213-8247-4190-a485-0a8e5a178916	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	tr	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:18.948905-04	2026-05-10 14:00:18.948905-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
fbd0e8b2-de10-4616-9eaa-24e49b574d9a	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	ur	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:19.359502-04	2026-05-10 14:00:19.359502-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
c8fd82fd-e787-4e7e-ae5b-a63272e18c16	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	vi	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:19.768151-04	2026-05-10 14:00:19.768151-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
76de8542-bb4d-48ee-8f17-7d1f1138247b	5bbe95a0-9f9d-445f-b9b4-d8a0a827ab49	zh	Vintage Rolex Submariner 16610	Full set, 2004, serviced 2025	auto	2026-05-10 14:00:20.17775-04	2026-05-10 14:00:20.17775-04	'16610':4A '2004':7B '2025':9B 'full':5B 'rolex':2A 'servic':8B 'set':6B 'submarin':3A 'vintag':1A
9b8e4a89-d962-4dc5-8844-63c3220b0f15	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	ar	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:20.792166-04	2026-05-10 14:00:20.792166-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
466732e6-50c6-4395-a9de-e787b663cd9a	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	de	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:21.304916-04	2026-05-10 14:00:21.304916-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
7085f5d2-640a-4265-90a5-dbcb5e735bef	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	es	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:21.713874-04	2026-05-10 14:00:21.713874-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
014fbada-b323-42b9-a26c-dccbb710f436	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	fa	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:22.123359-04	2026-05-10 14:00:22.123359-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
d7612fe8-f128-4962-bf58-e4ef27dc2133	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	fr	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:22.533952-04	2026-05-10 14:00:22.533952-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
33d21598-79b0-4d0f-958e-39dbab81bb41	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	hi	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:22.944085-04	2026-05-10 14:00:22.944085-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
28a39239-60da-4ba7-acd0-7b18237b710f	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	ja	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:23.352225-04	2026-05-10 14:00:23.352225-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
26ab3612-9a95-43d1-b1b5-e9d58a6766f7	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	ko	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:23.761492-04	2026-05-10 14:00:23.761492-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
8fff00ff-8021-4400-9fc3-3f32d672201e	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	pt	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:24.274778-04	2026-05-10 14:00:24.274778-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
b1aec8da-5dbc-40d3-a0fc-556f7cda0594	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	ru	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:24.683225-04	2026-05-10 14:00:24.683225-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
ed22b866-13f8-4c7a-a6f5-dd8cf9e4237a	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	sv	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:25.195853-04	2026-05-10 14:00:25.195853-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
e8676341-2747-4099-a5aa-4276c2a02a71	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	tl	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:25.605085-04	2026-05-10 14:00:25.605085-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
b53fbb6b-9155-4ef4-8f86-099825c343ef	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	tr	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:26.014483-04	2026-05-10 14:00:26.014483-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
e55a6eb8-234f-4999-af12-8b4ad5a3a272	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	ur	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:26.423683-04	2026-05-10 14:00:26.423683-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
d82f1713-77c7-4eba-bc48-80c45c571e1f	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	vi	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:26.834361-04	2026-05-10 14:00:26.834361-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
5ba8af95-678c-4cbd-805e-05b6eb1c6ab2	2d6ebb49-30ac-4c35-8845-37cf1ba9de86	zh	Vintage Leather Jacket - Schott Perfecto	Size M, worn 5 times, like new	auto	2026-05-10 14:00:27.242981-04	2026-05-10 14:00:27.242981-04	'5':9B 'jacket':3A 'leather':2A 'like':11B 'm':7B 'new':12B 'perfecto':5A 'schott':4A 'size':6B 'time':10B 'vintag':1A 'worn':8B
eccbf13f-0190-4f67-803a-56c9712b383b	5b2dd77a-683f-413f-871c-3a183663c837	ar	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:27.85761-04	2026-05-10 14:00:27.85761-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
919b83a5-c251-46a1-b354-2242f784435f	5b2dd77a-683f-413f-871c-3a183663c837	de	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:28.369563-04	2026-05-10 14:00:28.369563-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
ae52c0d3-f640-481d-b56b-fd568bda0061	5b2dd77a-683f-413f-871c-3a183663c837	es	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:28.779129-04	2026-05-10 14:00:28.779129-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
10ac4da8-a9fe-4805-afb3-63077e974c69	5b2dd77a-683f-413f-871c-3a183663c837	fa	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:29.188463-04	2026-05-10 14:00:29.188463-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
2a5ce842-5451-4faa-9a1d-f5f784b696f2	5b2dd77a-683f-413f-871c-3a183663c837	fr	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:29.827967-04	2026-05-10 14:00:29.827967-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
85048a22-1e5f-459f-bd1b-5e1398db3248	5b2dd77a-683f-413f-871c-3a183663c837	hi	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:30.285058-04	2026-05-10 14:00:30.285058-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
2a42964f-caf9-49dc-ab52-b1a3a64592a5	5b2dd77a-683f-413f-871c-3a183663c837	ja	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:30.724037-04	2026-05-10 14:00:30.724037-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
351ccea1-7288-426b-88da-416beccbed0f	5b2dd77a-683f-413f-871c-3a183663c837	ko	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:31.237678-04	2026-05-10 14:00:31.237678-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
8c4f3569-17f6-4f50-b7ad-5d31b28bba23	5b2dd77a-683f-413f-871c-3a183663c837	pt	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:31.651725-04	2026-05-10 14:00:31.651725-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
316fe898-eb36-401f-b0c6-78688ceb32ac	5b2dd77a-683f-413f-871c-3a183663c837	ru	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:32.05661-04	2026-05-10 14:00:32.05661-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
1593bcef-b043-4aed-92f0-8123924471da	5b2dd77a-683f-413f-871c-3a183663c837	sv	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:32.467184-04	2026-05-10 14:00:32.467184-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
f43f3010-37f3-4767-adf6-e57a331097e1	5b2dd77a-683f-413f-871c-3a183663c837	tl	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:32.875193-04	2026-05-10 14:00:32.875193-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
f7961b83-2b5a-4565-a2be-7d7bfcd5fa3a	5b2dd77a-683f-413f-871c-3a183663c837	tr	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:33.284838-04	2026-05-10 14:00:33.284838-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
0dad16d1-1dbd-4b82-9b95-f8b12a47187c	5b2dd77a-683f-413f-871c-3a183663c837	ur	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:33.694496-04	2026-05-10 14:00:33.694496-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
c0ade676-3e6c-4206-9c0f-289ec6657c97	5b2dd77a-683f-413f-871c-3a183663c837	vi	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:34.104296-04	2026-05-10 14:00:34.104296-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
ec98dbc1-797e-4622-9fd4-358fb7d3206f	5b2dd77a-683f-413f-871c-3a183663c837	zh	MacBook Pro M3 Max 16" 64GB 2TB	Space Black, AppleCare+, 3 cycles on battery	auto	2026-05-10 14:00:34.616422-04	2026-05-10 14:00:34.616422-04	'16':5A '2tb':7A '3':11B '64gb':6A 'applecar':10B 'batteri':14B 'black':9B 'cycl':12B 'm3':3A 'macbook':1A 'max':4A 'pro':2A 'space':8B
916cb294-5791-4d7a-9da3-b87d944bfa9e	a2408246-7d13-4d2b-9eea-040f942e0a69	ar	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:35.128461-04	2026-05-10 14:00:35.128461-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
1bce03f0-cd71-469d-a397-84409bdd414e	a2408246-7d13-4d2b-9eea-040f942e0a69	de	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:35.537452-04	2026-05-10 14:00:35.537452-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
6a33ff1b-483e-47cc-a5e8-7b7d4267389c	a2408246-7d13-4d2b-9eea-040f942e0a69	es	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:35.947367-04	2026-05-10 14:00:35.947367-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
a1d32aca-5834-4c94-bd1c-c11a7a787576	a2408246-7d13-4d2b-9eea-040f942e0a69	fa	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:36.356901-04	2026-05-10 14:00:36.356901-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
563c327e-2b8b-4bb0-b516-a1937d6183f1	a2408246-7d13-4d2b-9eea-040f942e0a69	fr	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:36.766873-04	2026-05-10 14:00:36.766873-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
6d7684d6-ffd1-4b19-9d4c-6dfc44d88f6c	a2408246-7d13-4d2b-9eea-040f942e0a69	hi	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:37.280455-04	2026-05-10 14:00:37.280455-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
5a08f395-0f42-49be-8fe9-ab8fdadd3266	a2408246-7d13-4d2b-9eea-040f942e0a69	ja	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:37.688599-04	2026-05-10 14:00:37.688599-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
5ee3b4e7-869c-4688-b6be-81766ab1cdfe	a2408246-7d13-4d2b-9eea-040f942e0a69	ko	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:38.097094-04	2026-05-10 14:00:38.097094-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
45739b42-3daf-432c-8e73-7da3e19993ad	a2408246-7d13-4d2b-9eea-040f942e0a69	pt	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:38.507698-04	2026-05-10 14:00:38.507698-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
cf9d3797-b787-4436-a1b4-f70c887b27e9	a2408246-7d13-4d2b-9eea-040f942e0a69	ru	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:38.916762-04	2026-05-10 14:00:38.916762-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
d92a6bf0-9815-44e6-b1df-f7c951fd686b	a2408246-7d13-4d2b-9eea-040f942e0a69	sv	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:39.429661-04	2026-05-10 14:00:39.429661-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
0ce1f25d-7782-4cd9-99cf-434ce52edf25	a2408246-7d13-4d2b-9eea-040f942e0a69	tl	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:39.839808-04	2026-05-10 14:00:39.839808-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
247ec78d-9555-4086-8049-c141edd0b80e	a2408246-7d13-4d2b-9eea-040f942e0a69	tr	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:40.456831-04	2026-05-10 14:00:40.456831-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
a6ee6d81-6753-44fb-89fe-fe61a1de3c92	a2408246-7d13-4d2b-9eea-040f942e0a69	ur	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:40.963665-04	2026-05-10 14:00:40.963665-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
5299fb80-06a9-434e-a412-60a45e3121fb	a2408246-7d13-4d2b-9eea-040f942e0a69	vi	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:41.374832-04	2026-05-10 14:00:41.374832-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
e1cb207d-9db4-4beb-8399-1eb92a61bbd9	a2408246-7d13-4d2b-9eea-040f942e0a69	zh	PS5 Digital Edition + 2 Controllers	Includes 5 games, original packaging	auto	2026-05-10 14:00:41.784575-04	2026-05-10 14:00:41.784575-04	'2':4A '5':7B 'control':5A 'digit':2A 'edit':3A 'game':8B 'includ':6B 'origin':9B 'packag':10B 'ps5':1A
388a8e5c-d2e5-49ff-ab5f-cf131669251f	3e170287-9b34-42fc-a3f6-cbc29aff1db6	es	Un nuevo iPhone 15 Pro Max	Como nuevo, con caja original y AppleCare+	auto	2026-05-10 14:00:42.231156-04	2026-05-10 14:00:42.231156-04	'15':4A 'applecar':13B 'caja':10B 'como':7B 'con':9B 'iphon':3A 'max':6A 'nuevo':2A,8B 'origin':11B 'pro':5A 'un':1A 'y':12B
04cd6c46-4b77-4f72-9746-bcffb9ce20df	3e170287-9b34-42fc-a3f6-cbc29aff1db6	tl	Un nuevo iPhone 15 Pro Max	Como nuevo, con caja original y AppleCare+	auto	2026-05-10 14:00:42.910891-04	2026-05-10 14:00:42.910891-04	'15':4A 'applecar':13B 'caja':10B 'como':7B 'con':9B 'iphon':3A 'max':6A 'nuevo':2A,8B 'origin':11B 'pro':5A 'un':1A 'y':12B
cb14da92-231d-4427-b285-594129874063	6bca6c89-cbd9-4870-bc85-9ed6cc3d6d9f	ar	آیفون ۱۵ پرو مکس جدید	در حد نو، با جعبه اصلی و اپل کر	auto	2026-05-10 14:00:43.422928-04	2026-05-10 14:00:43.422928-04	'آیفون':1A 'اصلی':11B 'اپل':13B 'با':9B 'جدید':5A 'جعبه':10B 'حد':7B 'در':6B 'مکس':4A 'نو':8B 'و':12B 'پرو':3A 'کر':14B '۱۵':2A
5599f327-0ff8-4b36-b5f8-f36b1681d566	9b036601-ffa4-40d6-b8ce-b23663f4282d	fr	Nouveau MacBook Pro M3	64 Go RAM, 2 To SSD, noir sidéral	auto	2026-05-10 14:00:43.934047-04	2026-05-10 14:00:43.934047-04	'2':8B '64':5B 'go':6B 'm3':4A 'macbook':2A 'noir':11B 'nouveau':1A 'pro':3A 'ram':7B 'sidéral':12B 'ssd':10B
c466c74b-865c-48a0-a7a5-6bad7ebcc704	9b036601-ffa4-40d6-b8ce-b23663f4282d	sv	Nouveau MacBook Pro M3	64 Go RAM, 2 To SSD, noir sidéral	auto	2026-05-10 14:00:44.448275-04	2026-05-10 14:00:44.448275-04	'2':8B '64':5B 'go':6B 'm3':4A 'macbook':2A 'noir':11B 'nouveau':1A 'pro':3A 'ram':7B 'sidéral':12B 'ssd':10B
ea5c1dc1-6289-4f60-a720-1490126f75fa	9b036601-ffa4-40d6-b8ce-b23663f4282d	ur	Nouveau MacBook Pro M3	64 Go RAM, 2 To SSD, noir sidéral	auto	2026-05-10 14:00:44.958895-04	2026-05-10 14:00:44.958895-04	'2':8B '64':5B 'go':6B 'm3':4A 'macbook':2A 'noir':11B 'nouveau':1A 'pro':3A 'ram':7B 'sidéral':12B 'ssd':10B
48f081f7-1887-4894-bf41-5125db782b23	9878222b-8d19-47d2-90ed-fcdc31ce9d48	zh	新しいPS5デジタルエディション	新品未開封、コントローラー2個付き	auto	2026-05-10 14:00:45.470608-04	2026-05-10 14:00:45.470608-04	'コントローラー2個付き':3B '新しいps5デジタルエディション':1A '新品未開封':2B
6091719a-8407-4e11-9076-9564a8b6115e	07f04923-8e6e-42ad-8f73-05faf24d3bcf	vi	Điện thoại Samsung Galaxy S24 mới	Còn nguyên hộp, bảo hành 12 tháng	auto	2026-05-10 14:00:46.085365-04	2026-05-10 14:00:46.085365-04	'12':12B 'bảo':10B 'còn':7B 'galaxi':4A 'hành':11B 'hộp':9B 'mới':6A 'nguyên':8B 's24':5A 'samsung':3A 'thoại':2A 'tháng':13B 'điện':1A
2d18d2cb-ac11-4e92-b162-a434ce2d9ea7	4456157c-9ed0-4afd-8ffe-08dde788e6a0	tl	Vintage Record Player - Technics SL-1200	Fully restored, new cartridge, sounds amazing	auto	2026-05-10 14:00:46.699248-04	2026-05-10 14:00:46.699248-04	'-1200':6A 'amaz':12B 'cartridg':10B 'fulli':7B 'new':9B 'player':3A 'record':2A 'restor':8B 'sl':5A 'sound':11B 'technic':4A 'vintag':1A
b077f6b7-daf2-4a19-9214-f7dcafda5337	3ac14778-6abc-4f23-9a3c-7d7552e0e7ca	tl	Handmade Leather Messenger Bag	Full grain leather, brass hardware, hand-stitched	auto	2026-05-10 14:00:47.313814-04	2026-05-10 14:00:47.313814-04	'bag':4A 'brass':8B 'full':5B 'grain':6B 'hand':11B 'hand-stitch':10B 'handmad':1A 'hardwar':9B 'leather':2A,7B 'messeng':3A 'stitch':12B
\.


--
-- Data for Name: shop_categories; Type: TABLE DATA; Schema: public; Owner: heavenslive
--

COPY public.shop_categories (id, category, display_name, parent_category, icon, display_order, is_active, created_at, updated_at, full_path, level, sort_order) FROM stdin;
0efbd5ca-5a62-40b5-83d6-b9e662c324f7	electronics	Electronics	\N	📱	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	1	1
f20f95f6-c6fa-4c1d-8175-6873e4ee4f75	clothing	Clothing	\N	👕	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	1	2
6fdf301a-04d4-48fa-993a-1daa527177f5	home	Home & Garden	\N	🏠	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	1	3
4bf19861-eb4c-4c35-aec6-441132371fb4	books	Books & Media	\N	📚	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	1	4
f8147ac4-d76a-4482-b253-6e8c21bc88e0	vehicles	Vehicles	\N	🚗	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	1	5
876d3e1d-2add-49f5-b824-9a8096a94481	collectibles	Collectibles	\N	💎	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	1	6
dc29ca59-5fca-4150-b033-95fd3aeed955	clothing_other	Other	clothing	📦	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	2	0
80b64f85-71ff-4b9f-8411-1685bdead44b	home_other	Other	home	📦	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	2	0
913ebc62-a796-4e6f-aad4-bac74ad514da	books_other	Other	books	📦	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	2	0
d0023c8e-95d1-43c6-ad9e-45d04039d0bb	vehicles_other	Other	vehicles	📦	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	2	0
d9fbc063-d245-4f52-a222-2bc6e132c713	collectibles_other	Other	collectibles	📦	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	2	0
c774a0fa-5871-49db-946c-9bf2749594e7	electronics_other	Other	electronics	📦	0	t	2026-05-09 22:24:38.198055	2026-05-09 22:24:38.198055	\N	2	99
c0c9a4a3-5712-4105-b12b-329de94b0d09	other	Other	\N	📦	0	t	2026-05-11 00:12:11.386099	2026-05-11 00:12:11.386099	\N	0	999
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: heavenslive
--

COPY public.wallets (id, user_id, balance_cents, created_at, updated_at) FROM stdin;
693e1744-8fec-4bb3-822c-e73115b4815b	3900aa10-2769-4646-9390-084a5b56f5f9	0	2026-03-30 05:31:01.636474	2026-03-31 02:51:48.835469
be23d591-31f7-4896-9846-52fe33952b74	4d189885-f836-485c-9cee-f779c4b35c15	0	2026-03-30 14:33:13.11719	2026-03-31 02:51:48.835469
c8641012-e2e2-4aef-a37d-191dcc84acda	e6cf0d07-3a9c-4e29-88f5-70838725a138	0	2026-03-30 14:35:41.124919	2026-03-31 02:51:48.835469
\.


--
-- PostgreSQL database dump complete
--

\unrestrict MYQThVgXjWRM6Wl7hUfcoLz8ckImvECt0CqYyjegXVrdO1ugSFhzV0rEJEcgwCp

