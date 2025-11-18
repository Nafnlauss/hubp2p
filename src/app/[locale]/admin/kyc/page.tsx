"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { approveKYC, rejectKYC } from "@/app/actions/admin"
import { CheckCircle, XCircle, FileText, Camera, User } from "lucide-react"

interface KYCVerification {
  id: string
  status: string
  document_type: string | null
  document_number: string | null
  document_front_url: string | null
  document_back_url: string | null
  selfie_url: string | null
  created_at: string
  rejection_reason: string | null
  profiles: {
    full_name: string
    cpf: string
    date_of_birth: string | null
  }
}

export default function KYCPage() {
  const [verifications, setVerifications] = useState<KYCVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({})
  const [selectedKyc, setSelectedKyc] = useState<KYCVerification | null>(null)

  useEffect(() => {
    loadVerifications()
  }, [])

  async function loadVerifications() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("kyc_verifications")
      .select(`
        *,
        profiles (
          full_name,
          cpf,
          date_of_birth
        )
      `)
      .in("status", ["pending", "in_review"])
      .order("created_at", { ascending: false })

    if (!error && data) {
      setVerifications(data as any)
    }

    setLoading(false)
  }

  async function handleApprove(kycId: string) {
    setActionLoading(kycId)

    const result = await approveKYC(kycId)

    if (result.success) {
      loadVerifications()
      setSelectedKyc(null)
    } else {
      alert(`Erro: ${result.error}`)
    }

    setActionLoading(null)
  }

  async function handleReject(kycId: string) {
    const reason = rejectionReason[kycId]

    if (!reason || reason.trim().length < 10) {
      alert("Por favor, forneça um motivo detalhado para a rejeição (mínimo 10 caracteres)")
      return
    }

    setActionLoading(kycId)

    const result = await rejectKYC(kycId, reason)

    if (result.success) {
      loadVerifications()
      setSelectedKyc(null)
      setRejectionReason({ ...rejectionReason, [kycId]: "" })
    } else {
      alert(`Erro: ${result.error}`)
    }

    setActionLoading(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">Pendente</Badge>
      case "in_review":
        return <Badge variant="default">Em Análise</Badge>
      case "approved":
        return <Badge variant="success">Aprovado</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Verificações KYC Pendentes</h1>
        <p className="mt-2 text-gray-600">
          Analise e aprove ou rejeite as verificações de identidade
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : verifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhuma verificação KYC pendente
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {verifications.map((kyc) => (
            <Card key={kyc.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{kyc.profiles.full_name}</CardTitle>
                  {getStatusBadge(kyc.status)}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>CPF: {kyc.profiles.cpf}</div>
                  <div>
                    Enviado em: {new Date(kyc.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Documentos */}
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      Documento - Frente
                    </Label>
                    {kyc.document_front_url ? (
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={kyc.document_front_url}
                          alt="Documento Frente"
                          className="w-full h-48 object-cover cursor-pointer hover:opacity-90"
                          onClick={() => window.open(kyc.document_front_url!, "_blank")}
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Não enviado</div>
                    )}
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      Documento - Verso
                    </Label>
                    {kyc.document_back_url ? (
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={kyc.document_back_url}
                          alt="Documento Verso"
                          className="w-full h-48 object-cover cursor-pointer hover:opacity-90"
                          onClick={() => window.open(kyc.document_back_url!, "_blank")}
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Não enviado</div>
                    )}
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Camera className="h-4 w-4" />
                      Selfie
                    </Label>
                    {kyc.selfie_url ? (
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={kyc.selfie_url}
                          alt="Selfie"
                          className="w-full h-48 object-cover cursor-pointer hover:opacity-90"
                          onClick={() => window.open(kyc.selfie_url!, "_blank")}
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Não enviada</div>
                    )}
                  </div>
                </div>

                {/* Informações do Documento */}
                {kyc.document_type && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-xs text-gray-600">Tipo de Documento</Label>
                      <div className="text-sm font-medium uppercase">{kyc.document_type}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Número</Label>
                      <div className="text-sm font-medium">{kyc.document_number}</div>
                    </div>
                  </div>
                )}

                {/* Integração Proteo (Mock) */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <Label className="text-blue-900">Verificação Proteo</Label>
                  </div>
                  <div className="text-sm text-blue-800">
                    Status: Verificação manual necessária
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Integração com API Proteo em desenvolvimento
                  </div>
                </div>

                {/* Área de Rejeição */}
                <div className="space-y-2">
                  <Label>Motivo da Rejeição (se aplicável)</Label>
                  <Textarea
                    placeholder="Descreva o motivo da rejeição..."
                    value={rejectionReason[kyc.id] || ""}
                    onChange={(e) =>
                      setRejectionReason({
                        ...rejectionReason,
                        [kyc.id]: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(kyc.id)}
                    disabled={
                      actionLoading === kyc.id ||
                      !rejectionReason[kyc.id] ||
                      rejectionReason[kyc.id].trim().length < 10
                    }
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => handleApprove(kyc.id)}
                    disabled={actionLoading === kyc.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estatísticas */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Verificações Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {verifications.filter((v) => v.status === "pending").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Em Análise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {verifications.filter((v) => v.status === "in_review").length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
