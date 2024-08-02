'use client';

import React, { useState } from 'react';
import { Input, Button, Table, Select, message } from 'antd';
import * as dotenv from 'dotenv';
dotenv.config();
const ELEVENLABS_API_KEY = 'sk_9eee905bb8cffa4f9b94b6d584953fa752a2869d76e646a7';
const { TextArea } = Input;
const { Option } = Select;
const columns = [
  {
    title: 'Nome da Voz',
    dataIndex: 'nomeVoz',
    key: 'nomeVoz',
  },
  {
    title: 'Categoria',
    dataIndex: 'categoriaVoz',
    key: 'categoriaVoz',
  },
  {
    title: 'Informações',
    dataIndex: 'infosVoz',
    key: 'infosVoz',
  },
  {
    title: 'Preview',
    dataIndex: 'previewVoz',
    key: 'previewVoz',
    render: (text: string) => (
      <audio controls>
        <source src={text} type="audio/mpeg"/>
      </audio>
    ),
  },
];

export default function Home() {
  const [dataSource, setDataSource] = useState<Array<{
    nomeVoz: string;
    categoriaVoz: string;
    infosVoz: string;
    previewVoz: string;
    voiceId: string;
  }>>([]);

  
  const [text, setText] = useState<string>(''); 
  const [audioUrl, setAudioUrl] = useState<string | null>(null); 
  const [loading, setLoading] = useState(false); 
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | undefined>(undefined); 
  const [mostrarTabela, setmostrarTabela] = useState(false);


  async function getVozes() {
    const options = {
      method: 'GET',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    };

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', options);

      if (!response.ok) {
        throw new Error('Erro na resposta');
      }

      const data = await response.json();
      const listaVozes = data.voices;

      const dadosFormatados = listaVozes.map((voice: any) => {
        const name = voice.name;
        const category = voice.category;
        const labelObject = voice.labels;
        const labels: string = JSON.stringify(labelObject);
        const preview_url = voice.preview_url;
        const voiceId = voice.voice_id;

        return {
          nomeVoz: name,
          categoriaVoz: category,
          infosVoz: labels,
          previewVoz: preview_url,
          voiceId, 
        };
      });

      setDataSource(dadosFormatados);

    } catch (error) {
      throw new Error('Erro ao buscar vozes');
    }
  }

  const textAreaEvento = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

 
  async function textToVoice() {
    if (!text || !selectedVoiceId) 
      return; 

    setLoading(true);

    try {
      const audioUrl = await textToAudio(text, selectedVoiceId);

     
      setAudioUrl(audioUrl);
      message.success('Áudio gerado com sucesso!');
    } catch (error) {
      message.error('Erro ao gerar áudio.');
    } finally {
      setLoading(false);
    }
  }

  
  const textToAudio = async (text: string, voiceId: string): Promise<string> => {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5', 
        }),
      });

      if (!response.ok) {
      
        throw new Error(`Erro na resposta da API:`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;

    } catch (error) {
      throw new Error('Erro ao gerar áudio:');
    }
  };
  
  const visualizacaoTabela = () => {
    if (!mostrarTabela) {
      getVozes();
    }
    setmostrarTabela(!mostrarTabela);
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: '20px',
    }}>
      <div style={{
        width: '80%',
        maxWidth: '1000px',
        textAlign: 'center',
        backgroundColor: '#fff',
        padding: '30px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Aplicação Text-to-Speech</h1> {}
        <div style={{
          marginBottom: '20px',
        }}>
          <TextArea
            showCount
            maxLength={100}
            onChange={textAreaEvento}
            placeholder="Insira o texto e teste algumas vozes!"
            style={{
              width: '100%',
              height: 120,
              resize: 'none',
            }}
          />
          <Button
            type="primary"
            size="large"
            style={{ width: '100%', marginTop: '10px' }}
            onClick={visualizacaoTabela}
          >Vozes Disponíveis</Button>
        </div>
        {dataSource.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <Select
                placeholder="Selecionar Voz"
                onChange={(value) => setSelectedVoiceId(value)}
                style={{ width: '50%' }}
              >
                {dataSource.map((voice) => (
                  <Option key={voice.voiceId} value={voice.voiceId}>
                    {voice.nomeVoz}
                  </Option>
                ))}
              </Select>
              <Button
                type="primary"
                size="large"
                style={{ width: '50%' }}
                onClick={textToVoice}
                loading={loading}
                disabled={!text || !selectedVoiceId}
              >Escutar Áudio</Button>
            </div>
          </>
        )}
        {audioUrl && (
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ marginRight: '10px' }}>Escute seu texto:</span>
            <audio controls>
              <source src={audioUrl} type="audio/mpeg" />
            </audio>
          </div>
        )}
        {audioUrl && (
          <Button
            type="default"
            style={{ marginTop: '20px' }}
            onClick={() => window.location.reload()}
          >Digitar Outro Texto</Button>
        )}
        {mostrarTabela && (
          <div style={{ marginTop: '20px' }}>
            <Table
              dataSource={dataSource}
              columns={columns}
              rowKey="voiceId"
              pagination={{
                pageSize: 4
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
