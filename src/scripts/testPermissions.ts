import axios from 'axios';

const API_BASE = 'http://localhost:3001';

async function testPermissionsSystem() {
  console.log('🧪 Testando Sistema de Permissões');
  console.log('====================================\n');

  try {
    // 1. Teste de Health Check
    console.log('1. Testando Health Check...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health Check OK:', healthResponse.data);
    
    // 2. Login com Admin
    console.log('\n2. Fazendo login como admin...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@barra.com',
      password: '123456'
    });
    console.log('✅ Login OK - Token recebido');
    
    const token = loginResponse.data.token;
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'x-unidade': 'BARRA'
    };

    // 3. Teste de obter permissões do usuário
    console.log('\n3. Obtendo permissões do usuário...');
    const permissionsResponse = await axios.get(`${API_BASE}/api/permissions/user/permissions`, {
      headers
    });
    console.log('✅ Permissões obtidas:', permissionsResponse.data.permissions?.slice(0, 5), '...');

    // 4. Teste de listar usuários (requer permissão USUARIOS_VISUALIZAR)
    console.log('\n4. Testando acesso à lista de usuários...');
    try {
      const usersResponse = await axios.get(`${API_BASE}/api/users`, {
        headers
      });
      console.log('✅ Acesso autorizado - Usuários encontrados:', usersResponse.data.length);
    } catch (error: any) {
      console.log('❌ Acesso negado:', error.response?.data?.message);
    }

    // 5. Login com usuário de recepção
    console.log('\n5. Testando com usuário de recepção...');
    const receptionLoginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'recepcao@barra.com',
      password: '123456'
    });
    
    const receptionToken = receptionLoginResponse.data.token;
    const receptionHeaders = { 
      'Authorization': `Bearer ${receptionToken}`,
      'x-unidade': 'BARRA'
    };

    // 6. Teste de permissões da recepção
    console.log('\n6. Testando permissões da recepção...');
    const receptionPermissions = await axios.get(`${API_BASE}/api/permissions/user/permissions`, {
      headers: receptionHeaders
    });
    console.log('✅ Permissões da recepção:', receptionPermissions.data.permissions?.slice(0, 5), '...');

    // 7. Teste de acesso negado para recepção
    console.log('\n7. Testando acesso restrito da recepção...');
    try {
      await axios.get(`${API_BASE}/api/users`, {
        headers: receptionHeaders
      });
      console.log('⚠️ Recepção teve acesso (verificar se deveria ter)');
    } catch (error: any) {
      console.log('✅ Acesso corretamente negado para recepção:', error.response?.data?.message);
    }

    console.log('\n🎉 Teste do sistema de permissões concluído com sucesso!');

  } catch (error: any) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response?.data) {
      console.error('Detalhes do erro:', error.response.data);
    }
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  testPermissionsSystem();
}

export default testPermissionsSystem;
