alter table registrations add column if not exists email_optin boolean not null default false;
alter table registrations add column if not exists paid boolean not null default false;
alter table registrations add column if not exists paid_at timestamptz;
alter table registrations add column if not exists payment_email_sent_at timestamptz;
