import React, { useState } from 'react';
import {
  Flex,
  useColorModeValue,
  Box,
  Heading,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Icon,
} from '@chakra-ui/react';
import { FcPlus, FcCameraIdentification } from 'react-icons/fc';
import { Link } from 'react-router-dom';
import InventaireForm from './components/InventaireForm';
import AfficherMateriels from './components/AfficherMateriels';
import QrCodeImageExport from './components/QrCodeImageExport';
import VideoCaptureBisBis from './components/VideoCaptureBisBis';
import CameraStream from './components/CameraStream';

const Materiel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleCreateMaterialModal = () => setShowCreateMaterial(!showCreateMaterial);
  const toggleQRScannerModal = () => setShowQRScannerModal(!showQRScannerModal);
  const [showCameraStreamModal, setShowCameraStreamModal] = useState(false);
  const toggleCameraStreamModal = () => setShowCameraStreamModal(!showCameraStreamModal);

  return (
    <Box pt={{ base: '180px', md: '80px', xl: '80px' }}>
      <Flex justifyContent="flex-start" alignItems="center" mb="4">
        <Heading color={textColor} fontSize="2xl" fontWeight="700" lineHeight="100%" mr={4}>
          Gestion du Matériel
        </Heading>
        {/* Wrapper Flex pour les boutons */}
        <Flex>
          <Button
            onClick={toggleCreateMaterialModal}
            leftIcon={<Icon as={FcPlus} />}
            colorScheme="blue"
            variant="solid"
            size="md"
            boxShadow="sm"
            _hover={{ boxShadow: 'md' }}
            _active={{ boxShadow: 'lg' }}
            mr={2}
            display="none"
          >
            Créer un matériel
          </Button>
          <Link to="/admin/qr-scanner">
            <Button
              leftIcon={<Icon as={FcCameraIdentification} />}
              colorScheme="blue"
              variant="solid"
              size="md"
              boxShadow="sm"
              _hover={{ boxShadow: 'md' }}
              _active={{ boxShadow: 'lg' }}
              mr={2}
            >
              Scanner un QRCode
            </Button>
          </Link>
          <Button
            onClick={openModal}
            leftIcon={<Icon as={FcPlus} />}
            colorScheme="blue"
            variant="solid"
            size="md"
            boxShadow="sm"
            _hover={{ boxShadow: 'md' }}
            _active={{ boxShadow: 'lg' }}
            display="none"
          >
            Feuille d'impression des étiquettes
          </Button>
          {/* Nouveau bouton pour accéder au flux caméra */}
          <Button
            onClick={toggleCameraStreamModal}
            leftIcon={<Icon as={FcCameraIdentification} />}
            colorScheme="blue"
            variant="solid"
            size="md"
            boxShadow="sm"
            _hover={{ boxShadow: 'md' }}
            _active={{ boxShadow: 'lg' }}
            mr={2}
          >
            Accéder au flux caméra
          </Button>
        </Flex>
      </Flex>

      <AfficherMateriels />

      {/* Modal pour l'impression des étiquettes */}
      <Modal isOpen={isOpen} onClose={closeModal} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <QrCodeImageExport />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={closeModal}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pour la création d'un matériel */}
      <Modal isOpen={showCreateMaterial} onClose={toggleCreateMaterialModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Créer un matériel</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <InventaireForm />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={toggleCreateMaterialModal}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal pour le scanner QR */}
      <Modal isOpen={showQRScannerModal} onClose={toggleQRScannerModal} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <VideoCaptureBisBis />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={toggleQRScannerModal}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
       {/* Modal pour le flux caméra */}
       <Modal isOpen={showCameraStreamModal} onClose={toggleCameraStreamModal} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <CameraStream />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={toggleCameraStreamModal}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Materiel;
