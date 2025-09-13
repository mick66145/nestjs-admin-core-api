-- CreateTable
CREATE TABLE "user_account" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "expire_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "user_account_id" INTEGER NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "send_sms_log" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "send_time" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "user_account_id" INTEGER NOT NULL,

    CONSTRAINT "send_sms_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "send_mail_log" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "user_account_id" INTEGER NOT NULL,

    CONSTRAINT "send_mail_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "is_valid" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_root" BOOLEAN NOT NULL DEFAULT false,
    "user_account_id" INTEGER NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_account_id")
);

-- CreateTable
CREATE TABLE "verify_token" (
    "type" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_account_id" INTEGER NOT NULL,

    CONSTRAINT "verify_token_pkey" PRIMARY KEY ("user_account_id","type","token")
);

-- CreateTable
CREATE TABLE "role" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_has_permission" (
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "permission" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "role_has_permission_pkey" PRIMARY KEY ("role_id","permission")
);

-- CreateTable
CREATE TABLE "user_account_has_role" (
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "user_account_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "user_account_has_role_pkey" PRIMARY KEY ("user_account_id","role_id")
);

-- CreateTable
CREATE TABLE "user_account_has_permission" (
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "permission" TEXT NOT NULL,
    "user_account_id" INTEGER NOT NULL,

    CONSTRAINT "user_account_has_permission_pkey" PRIMARY KEY ("user_account_id","permission")
);

-- CreateIndex
CREATE UNIQUE INDEX "verify_token_type_token_key" ON "verify_token"("type", "token");

-- AddForeignKey
ALTER TABLE "verification" ADD CONSTRAINT "verification_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "send_sms_log" ADD CONSTRAINT "send_sms_log_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "send_mail_log" ADD CONSTRAINT "send_mail_log_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verify_token" ADD CONSTRAINT "verify_token_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_has_permission" ADD CONSTRAINT "role_has_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_account_has_role" ADD CONSTRAINT "user_account_has_role_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_account_has_role" ADD CONSTRAINT "user_account_has_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_account_has_permission" ADD CONSTRAINT "user_account_has_permission_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
