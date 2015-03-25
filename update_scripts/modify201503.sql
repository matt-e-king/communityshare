alter table "user"
      add column is_educator boolean not null default 'f',
      add column is_community_partner boolean not null default 'f',
      add column search_text character varying(2000);
       
       
       

