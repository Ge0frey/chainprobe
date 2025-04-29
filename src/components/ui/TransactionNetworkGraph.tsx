import { useEffect, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { HeliusTransaction } from '../../services/solana';
import * as THREE from 'three';
import { Spinner } from './Spinner';

interface TransactionNode {
  id: string;
  name: string;
  val: number;
  color?: string;
  group?: number;
  isSelected?: boolean;
  type: 'address' | 'transaction';
}

interface TransactionLink {
  source: string;
  target: string;
  value: number;
  type: string;
  color?: string;
}

interface TransactionGraphData {
  nodes: TransactionNode[];
  links: TransactionLink[];
}

interface TransactionNetworkGraphProps {
  transactions: HeliusTransaction[];
  centerAddress: string;
  onNodeClick?: (node: TransactionNode) => void;
  width?: number;
  height?: number;
  selectedNode?: string | null;
}

export const TransactionNetworkGraph = ({
  transactions,
  centerAddress,
  onNodeClick,
  width = 800,
  height = 600,
  selectedNode
}: TransactionNetworkGraphProps) => {
  const [graphData, setGraphData] = useState<TransactionGraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const fgRef = useRef<any>();

  // Process transactions into graph data
  useEffect(() => {
    if (!transactions || !centerAddress) {
      setGraphData({ nodes: [], links: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Create nodes and links
    const nodes: TransactionNode[] = [];
    const links: TransactionLink[] = [];
    const addressMap = new Map<string, boolean>();
    const transactionMap = new Map<string, boolean>();

    // Add center node
    nodes.push({
      id: centerAddress,
      name: `${centerAddress.slice(0, 6)}...${centerAddress.slice(-4)}`,
      val: 8,
      color: '#9945FF', // Solana purple
      group: 0,
      type: 'address'
    });
    addressMap.set(centerAddress, true);

    // Process each transaction
    transactions.forEach(tx => {
      // Add transaction node if it doesn't exist
      if (!transactionMap.has(tx.signature)) {
        nodes.push({
          id: tx.signature,
          name: `${tx.signature.slice(0, 6)}...${tx.signature.slice(-4)}`,
          val: 3,
          color: '#14F195', // Solana teal
          group: 1,
          type: 'transaction'
        });
        transactionMap.set(tx.signature, true);

        // Link center address to transaction
        links.push({
          source: centerAddress,
          target: tx.signature,
          value: 1,
          type: tx.type || 'UNKNOWN',
          color: '#9945FF80' // Semi-transparent purple
        });

        // If we have source or destination, add those nodes and links too
        if (tx.source && tx.source !== centerAddress) {
          if (!addressMap.has(tx.source)) {
            nodes.push({
              id: tx.source,
              name: `${tx.source.slice(0, 6)}...${tx.source.slice(-4)}`,
              val: 5,
              color: '#00C2FF', // Solana blue
              group: 2,
              type: 'address'
            });
            addressMap.set(tx.source, true);
          }

          links.push({
            source: tx.source,
            target: tx.signature,
            value: 1,
            type: 'SOURCE',
            color: '#00C2FF80' // Semi-transparent blue
          });
        }

        if (tx.destination && tx.destination !== centerAddress) {
          if (!addressMap.has(tx.destination)) {
            nodes.push({
              id: tx.destination,
              name: `${tx.destination.slice(0, 6)}...${tx.destination.slice(-4)}`,
              val: 5,
              color: '#FF6B6B', // Solana pink
              group: 3,
              type: 'address'
            });
            addressMap.set(tx.destination, true);
          }

          links.push({
            source: tx.signature,
            target: tx.destination,
            value: 1,
            type: 'DESTINATION',
            color: '#FF6B6B80' // Semi-transparent pink
          });
        }
      }
    });

    setGraphData({ nodes, links });
    setIsLoading(false);
  }, [transactions, centerAddress]);

  // Apply visual effects when the graph is initialized
  useEffect(() => {
    if (fgRef.current) {
      // Add bloom effect for glow
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        1.5,
        0.4,
        0.85
      );
      bloomPass.threshold = 0;
      bloomPass.strength = 0.75;
      bloomPass.radius = 0.75;
      fgRef.current.postProcessingComposer().addPass(bloomPass);

      // Set camera position
      fgRef.current.cameraPosition({ z: 200 });

      // If a node is selected, focus on it
      if (selectedNode) {
        const node = graphData.nodes.find(n => n.id === selectedNode);
        if (node) {
          fgRef.current.centerAt(node.x, node.y, node.z, 1000);
          fgRef.current.zoom(8, 1000);
        }
      }
    }
  }, [fgRef.current, selectedNode, width, height, graphData.nodes]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center" style={{ width, height }}>
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-sm text-gray-600 dark:text-gray-400">Building transaction network...</p>
        </div>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex justify-center items-center" style={{ width, height }}>
        <p className="text-gray-600 dark:text-gray-400">No transaction data available to visualize</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel={(node: any) => `${node.type === 'address' ? '🏠' : '📝'} ${node.name}`}
        linkLabel={(link: any) => link.type}
        nodeColor={(node: any) => node.id === selectedNode ? '#FFFFFF' : node.color}
        nodeVal={(node: any) => node.id === selectedNode ? node.val * 2 : node.val}
        linkColor={(link: any) => link.color}
        linkWidth={(link: any) => link.value}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        linkDirectionalParticles={1}
        linkDirectionalParticleSpeed={0.003}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={(link: any) => link.color}
        onNodeClick={(node: any) => onNodeClick && onNodeClick(node)}
        nodeThreeObject={(node: any) => {
          const group = new THREE.Group();
          
          // Sphere
          const geometry = new THREE.SphereGeometry(node.val);
          const material = new THREE.MeshLambertMaterial({
            color: node.id === selectedNode ? '#FFFFFF' : node.color,
            transparent: true,
            opacity: 0.8
          });
          const mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
          
          // Glow
          if (node.id === selectedNode) {
            const glowGeometry = new THREE.SphereGeometry(node.val * 1.5);
            const glowMaterial = new THREE.MeshBasicMaterial({
              color: '#FFFFFF',
              transparent: true,
              opacity: 0.2
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            group.add(glowMesh);
          }
          
          return group;
        }}
        linkThreeObjectExtend={true}
        linkThreeObject={(link: any) => {
          // Add arrow indicators on the links
          if (link.source.id !== centerAddress && link.target.id !== centerAddress) {
            const material = new THREE.MeshBasicMaterial({
              color: link.color,
              transparent: true,
              opacity: 0.6
            });
            const geometry = new THREE.ConeGeometry(2, 5);
            const mesh = new THREE.Mesh(geometry, material);
            return mesh;
          }
          return null;
        }}
        linkPositionUpdate={(obj, { start, end }) => {
          if (obj) {
            const direction = new THREE.Vector3().subVectors(end, start);
            const midPoint = new THREE.Vector3().addVectors(start, direction.multiplyScalar(0.5));
            obj.position.copy(midPoint);
            obj.lookAt(end);
          }
          return false;
        }}
      />
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 p-2 rounded-lg bg-black/40 backdrop-blur-sm text-white text-xs">
        <div className="font-semibold mb-1">Network Legend</div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-[#9945FF]"></span>
          <span>Center Address</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-[#14F195]"></span>
          <span>Transactions</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-[#00C2FF]"></span>
          <span>Source Addresses</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-[#FF6B6B]"></span>
          <span>Destination Addresses</span>
        </div>
      </div>
    </div>
  );
}; 