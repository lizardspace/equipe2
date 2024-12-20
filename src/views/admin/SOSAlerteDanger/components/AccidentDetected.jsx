import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Text,
  Button,
  VStack,
  CircularProgress,
  CircularProgressLabel,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { PhoneIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { supabase } from './../../../../supabaseClient';
import { useTeam } from './../../InterfaceEquipe/TeamContext';
import { useEvent } from './../../../../EventContext';

const DEFAULT_TEAM_ID = '00000000-0000-0000-0000-000000000000';
const DEFAULT_TEAM_NAME = 'Aucune équipe';

const AccidentDetected = () => {
  const [counter, setCounter] = useState(30);
  const [step, setStep] = useState(1);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [alertId, setAlertId] = useState(null);
  const [supabaseURL, setSupabaseURL] = useState('');
  const [isCancelled, setIsCancelled] = useState(false);
  const { teamUUID, selectedTeam } = useTeam();
  const { selectedEventId } = useEvent();
  const videoRef = useRef();
  const mediaRecorderRef = useRef();
  const recordedChunksRef = useRef([]);

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Erreur lors de la récupération de la position GPS :', error);
            resolve({ latitude: null, longitude: null });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        resolve({ latitude: null, longitude: null });
      }
    });
  }, []);

  const saveAlertData = useCallback(
    async (lat, long, timeForUser) => {
      const { data, error } = await supabase
        .from('vianney_sos_alerts')
        .insert([
          {
            team_id: teamUUID || DEFAULT_TEAM_ID,
            latitude: lat || null,
            longitude: long || null,
            created_at: new Date().toISOString(),
            time_for_user: timeForUser,
            url: '',
            team_name: selectedTeam || DEFAULT_TEAM_NAME,
            event_id: selectedEventId,
          },
        ])
        .select();

      if (error) {
        console.error('Erreur lors de l’insertion des données d’alerte :', error);
      } else if (data?.length) {
        setAlertId(data[0].id);
      }
    },
    [teamUUID, selectedTeam, selectedEventId]
  );

  const uploadVideoToSupabase = useCallback(async (blob) => {
    const fileName = `sos_recording_${new Date().toISOString()}.webm`;
    try {
      const { data, error } = await supabase.storage.from('sos-alerts-video').upload(fileName, blob);

      if (error) {
        console.error('Erreur lors du téléchargement de la vidéo :', error);
        alert('Erreur lors du téléchargement de la vidéo. Veuillez vérifier le bucket.');
        return;
      }

      const videoUrl = `https://hvjzemvfstwwhhahecwu.supabase.co/storage/v1/object/public/sos-alerts-video/${data.path}`;
      setSupabaseURL(videoUrl);
    } catch (err) {
      console.error('Erreur inattendue lors du téléchargement de la vidéo :', err);
      alert('Erreur inattendue lors du téléchargement de la vidéo.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    recordedChunksRef.current = [];
    try {
      const constraints = {
        video: { facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        uploadVideoToSupabase(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setTimeout(() => stopRecording(), 5000);
    } catch (error) {
      console.error('Erreur lors de l’accès aux médias :', error);
      alert('Erreur lors de l’accès à la caméra ou au microphone.');
    }
  }, [uploadVideoToSupabase, stopRecording]);

  const confirmSOS = useCallback(() => {
    setStep(3);
    // Start recording and location retrieval simultaneously
    startRecording();

    getCurrentLocation()
      .then(async (location) => {
        setLatitude(location.latitude);
        setLongitude(location.longitude);
        await saveAlertData(location.latitude, location.longitude, new Date().toISOString());
      })
      .catch(async (error) => {
        console.error('Error getting location:', error);
        // Even if there's an error, proceed to save alert data with null GPS values
        await saveAlertData(null, null, new Date().toISOString());
      });
  }, [getCurrentLocation, saveAlertData, startRecording]);

  const cancelSOS = useCallback(() => {
    setStep(1);
    setCounter(30);
    setLatitude(null);
    setLongitude(null);
    setAlertId(null);
    setSupabaseURL('');
    setIsCancelled(true);
    // Stop recording if it's in progress
    stopRecording();
  }, [stopRecording]);

  useEffect(() => {
    if (supabaseURL && alertId) {
      const updateAlert = async () => {
        const { error } = await supabase
          .from('vianney_sos_alerts')
          .update({ url: supabaseURL })
          .eq('id', alertId);

        if (error) {
          console.error('Erreur lors de la mise à jour de l’alerte avec l’URL de la vidéo :', error);
        }
      };
      updateAlert();
    }
  }, [supabaseURL, alertId]);

  useEffect(() => {
    let timer;
    if (step === 2 && counter > 0 && !isCancelled) {
      timer = setInterval(() => setCounter((prev) => prev - 1), 1000);
    } else if (counter === 0 && step === 2 && !isCancelled) {
      confirmSOS();
    }
    return () => clearInterval(timer);
  }, [step, counter, confirmSOS, isCancelled]);

  useEffect(() => {
    if (step === 1 && !isCancelled) {
      const timer = setTimeout(() => setStep(2), 3000);
      return () => clearTimeout(timer);
    }
  }, [step, isCancelled]);

  return (
    <Center height="100vh" bg="gray.50" p={4}>
      {step === 1 && (
        <VStack spacing={8} bg="white" p={6} rounded="md" shadow="md">
          <Text fontSize="2xl" fontWeight="bold">
            Déclencher un SOS
          </Text>
          <Button leftIcon={<PhoneIcon />} colorScheme="red" size="lg" onClick={() => setStep(2)}>
            Déclencher un SOS
          </Button>
        </VStack>
      )}
      {step === 2 && (
        <VStack spacing={8} bg="white" p={6} rounded="md" shadow="md">
          <Text fontSize="lg" color="red.500" fontWeight="bold">
            SOS-sans contact
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            Demande d'aide
          </Text>
          <Text fontSize="md" color="gray.500">
            Envoi de l'alerte dans
          </Text>
          <CircularProgress value={(counter / 30) * 100} size="120px" color="green.400">
            <CircularProgressLabel>{counter}s</CircularProgressLabel>
          </CircularProgress>
          <Button leftIcon={<CheckIcon />} colorScheme="green" onClick={confirmSOS}>
            Confirmer l'alerte
          </Button>
          <Button leftIcon={<CloseIcon />} colorScheme="red" onClick={cancelSOS}>
            Annuler l'alerte
          </Button>
        </VStack>
      )}
      {step === 3 && (
        <VStack spacing={8} bg="white" p={6} rounded="md" shadow="md">
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Alerte déclenchée!</AlertTitle>
            <AlertDescription>
              Une alerte a été envoyée.
              {latitude !== null && longitude !== null ? (
                <Text>
                  GPS: {latitude}, {longitude}
                </Text>
              ) : (
                <Text>Position GPS non disponible.</Text>
              )}
            </AlertDescription>
          </Alert>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '400px' }} />
        </VStack>
      )}
    </Center>
  );
};

export default AccidentDetected;
