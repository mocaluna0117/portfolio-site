"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Mail } from "lucide-react";
import { formatDateTime } from "@/components/admin/import-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS = {
  sent: { label: "メール送信済み", className: "" },
  pending: { label: "送信中", className: "text-muted-foreground" },
  failed: { label: "メール未送信", className: "text-destructive border-destructive/40" },
} as const;

export function MessagesAdmin() {
  const messages = useQuery(api.contact.list, {});
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">お問い合わせ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          フォームから届いたものの新しい順（100件まで）。メールが送れなかったものもここに残ります。
        </p>
      </div>
      {messages === undefined ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : messages.length === 0 ? (
        <p className="text-muted-foreground">まだ届いていません。</p>
      ) : (
        <ol className="grid gap-4">
          {messages.map((message) => (
            <li key={message._id}>
              <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">{message.name}</p>
                    <a
                      href={`mailto:${message.email}`}
                      className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                    >
                      <Mail className="size-3.5" aria-hidden />
                      {message.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={STATUS[message.status].className}
                      title={message.error}
                    >
                      {STATUS[message.status].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(message.createdAt)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.body}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
