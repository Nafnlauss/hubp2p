# Headers para Configurar no Proteo

Se o Proteo pedir headers customizados, configure:

## Header de Autorização (Opcional - já está no query param)

```
Authorization: Bearer 2e6c1508e42ee764beafac09c08ccd1234e0ae7da1b98d787a4e3e2ad429f7ae
```

## Headers Básicos (Necessários)

```
Content-Type: application/json
Accept: application/json
```

## Se houver problema com User-Agent

```
User-Agent: Proteo-Webhook/1.0
```

---

**IMPORTANTE**: Se o Proteo não permitir configurar headers, deixe em branco.
O webhook já aceita autenticação via query parameter (?secret=...).
